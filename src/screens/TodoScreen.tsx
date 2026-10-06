import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Modal, TextInput, Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../theme/ThemeContext';

interface TodoScreenProps {
  onBack: () => void;
  token: string | null;
}

interface Todo {
  id: number;
  title: string;
  description: string | null;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  start_date: string | null;
  due_date: string | null;
  category: string;
  is_completed: boolean;
}

type FilterMode = 'today' | 'urgent' | 'scheduled' | 'archive';

export default function TodoScreen({ onBack, token }: TodoScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>('today');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState<Todo | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('General');

  const getApiUrl = (endpoint: string) => {
    return Platform.OS === 'web' 
      ? `http://${window.location.hostname}/atech_prime/backend/public${endpoint}`
      : `http://192.168.100.31/atech_prime/backend/public${endpoint}`;
  };

  const toDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const todayStr = toDateString(new Date());

  const formatDisplayDate = (start: string | null, due: string | null) => {
    const format = (dStr: string) => {
      const parts = dStr.split('-');
      if (parts.length !== 3) return dStr;
      const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };
    if (!start && !due) return '';
    if (start && due && start === due) return format(start);
    if (start && due) return `${format(start)} to ${format(due)}`;
    if (start) return `Starts ${format(start)}`;
    if (due) return `Due ${format(due)}`;
    return '';
  };

  const fetchTodos = async () => {
    if (!token) return;
    try {
      const response = await fetch(getApiUrl('/api/todos'), {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTodos(data);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [token]);

  const openAddModal = () => {
    setEditTarget(null);
    setTitle('');
    setDescription('');
    setPriority(filterMode === 'urgent' ? 'High' : 'Medium');
    setStatus('Pending');
    setStartDate(todayStr);
    setDueDate(todayStr);
    setCategory('General');
    setModalVisible(true);
  };

  const openEditModal = (todo: Todo) => {
    setEditTarget(todo);
    setTitle(todo.title);
    setDescription(todo.description || '');
    setPriority(todo.priority);
    setStatus(todo.status);
    setStartDate(todo.start_date || '');
    setDueDate(todo.due_date || '');
    setCategory(todo.category || 'General');
    setModalVisible(true);
  };

  const saveTodo = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    setIsSubmitting(true);
    const body = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
      start_date: startDate || null,
      due_date: dueDate || null,
      category: category.trim() || 'General'
    };

    try {
      const url = editTarget 
        ? getApiUrl(`/api/todos/${editTarget.id}`) 
        : getApiUrl('/api/todos');
      const method = editTarget ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        if (editTarget) {
          setTodos(todos.map(t => t.id === data.id ? data : t));
        } else {
          setTodos([data, ...todos]);
        }
        setModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComplete = async (todo: Todo) => {
    try {
      const response = await fetch(getApiUrl(`/api/todos/${todo.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_completed: !todo.is_completed })
      });
      if (response.ok) {
        const data = await response.json();
        setTodos(todos.map(t => t.id === data.id ? data : t));
      }
    } catch (error) {
      console.error('Toggle failed', error);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const response = await fetch(getApiUrl(`/api/todos/${id}`), {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setTodos(todos.filter(t => t.id !== id));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  // Filter Logic
  let displayTodos = todos;
  if (filterMode === 'today') {
    displayTodos = todos.filter(t => !t.is_completed && (t.due_date === todayStr || t.start_date === todayStr || (t.start_date && t.due_date && t.start_date <= todayStr && t.due_date >= todayStr)));
  } else if (filterMode === 'urgent') {
    displayTodos = todos.filter(t => t.priority === 'High' && !t.is_completed);
  } else if (filterMode === 'scheduled') {
    displayTodos = todos.filter(t => !t.is_completed && (t.start_date || t.due_date));
  } else if (filterMode === 'archive') {
    displayTodos = todos.filter(t => t.is_completed);
  }

  const renderBadge = (text: string, color: string, bgColor: string) => (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor: color + '40' }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Signature Top Gradient Strip */}
      <LinearGradient
        colors={theme.accentGradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 3, width: '100%' }}
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Workstation Tasks</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['today', 'urgent', 'scheduled', 'archive'] as FilterMode[]).map((mode) => {
            const isActive = filterMode === mode;
            let icon = 'target';
            if (mode === 'urgent') icon = 'flag';
            if (mode === 'scheduled') icon = 'calendar';
            if (mode === 'archive') icon = 'archive';
            
            return (
              <TouchableOpacity 
                key={mode}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilterMode(mode)}
              >
                <Feather name={icon as any} size={14} color={isActive ? theme.primary : theme.textSecondary} />
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : displayTodos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Feather name="inbox" size={48} color={theme.border} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>No records found in {filterMode}.</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} contentContainerStyle={{ paddingBottom: 100 }}>
          {displayTodos.map(todo => {
            const isExpanded = expandedId === todo.id;
            
            const getPriorityColorStr = (p: string) => {
              if (p === 'High') return theme.error;
              if (p === 'Medium') return theme.warning;
              return theme.primary;
            };

            return (
              <TouchableOpacity 
                key={todo.id} 
                style={[
                  styles.card, 
                  todo.is_completed && styles.cardCompleted,
                  { borderLeftWidth: 3, borderLeftColor: getPriorityColorStr(todo.priority) }
                ]}
                onPress={() => toggleExpand(todo.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeaderRow}>
                  <TouchableOpacity 
                    style={styles.checkbox} 
                    onPress={() => toggleComplete(todo)}
                  >
                    <Feather 
                      name={todo.is_completed ? "check-circle" : "circle"} 
                      size={22} 
                      color={todo.is_completed ? theme.success : theme.textSecondary} 
                    />
                  </TouchableOpacity>
                  
                  <View style={styles.cardHeaderTitle}>
                    <Text 
                      style={[styles.todoTitle, todo.is_completed && styles.textCompleted]}
                      numberOfLines={isExpanded ? undefined : 1}
                    >
                      {todo.title}
                    </Text>
                  </View>

                  <Feather 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.textSecondary} 
                    style={{ marginLeft: 8 }}
                  />
                </View>

                {isExpanded && (
                  <View style={styles.cardExpandedContent}>
                    {todo.description ? (
                      <Text style={styles.todoDesc}>{todo.description}</Text>
                    ) : null}
                    
                    <View style={styles.badgesRow}>
                      {todo.priority === 'High' && renderBadge('High', theme.error, theme.error + '10')}
                      {todo.priority === 'Medium' && renderBadge('Medium', theme.warning, theme.warning + '10')}
                      {todo.priority === 'Low' && renderBadge('Low', theme.primary, theme.primary + '10')}
                      
                      {todo.status === 'Completed' && renderBadge('Completed', theme.success, theme.success + '10')}
                      {todo.status === 'In Progress' && renderBadge('In Progress', theme.primary, theme.primary + '10')}
                      {todo.status === 'Pending' && renderBadge('Pending', theme.textSecondary, theme.border)}
                    </View>
                    
                    <View style={styles.metaRow}>
                      {(todo.start_date || todo.due_date) && (
                        <View style={styles.metaItem}>
                          <Feather name="clock" size={12} color={theme.textSecondary} />
                          <Text style={styles.metaText}>
                            {formatDisplayDate(todo.start_date, todo.due_date)}
                          </Text>
                        </View>
                      )}
                      {todo.category ? (
                        <View style={styles.metaItem}>
                          <Feather name="tag" size={12} color={theme.textSecondary} />
                          <Text style={styles.metaText}>{todo.category}</Text>
                        </View>
                      ) : null}
                    </View>
                    
                    <View style={styles.cardExpandedActions}>
                      <TouchableOpacity style={styles.actionBtnOutline} onPress={() => openEditModal(todo)}>
                        <Feather name="edit-2" size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={styles.actionBtnOutlineText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtnOutline, { borderColor: theme.error + '40' }]} onPress={() => {
                        if (Platform.OS === 'web') {
                          if (window.confirm('Delete this record?')) deleteTodo(todo.id);
                        } else {
                          Alert.alert('Delete', 'Are you sure?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteTodo(todo.id) }
                          ]);
                        }
                      }}>
                        <Feather name="trash-2" size={14} color={theme.error} style={{ marginRight: 6 }} />
                        <Text style={[styles.actionBtnOutlineText, { color: theme.error }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <LinearGradient colors={['#10b981', '#08697A']} style={styles.fabGradient}>
          <Feather name="plus" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Signature Top Gradient Strip requirement */}
            <LinearGradient colors={theme.accentGradient as any} style={styles.modalGradientStrip} start={{x: 0, y: 0}} end={{x: 1, y: 0}} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editTarget ? 'Edit Task' : 'New Task'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Title *</Text>
              <TextInput 
                style={styles.input} 
                value={title} 
                onChangeText={setTitle} 
                placeholder="Task title..." 
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={description} 
                onChangeText={setDescription} 
                placeholder="Additional details..." 
                multiline 
                numberOfLines={3} 
                textAlignVertical="top"
                placeholderTextColor={theme.textSecondary}
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Priority</Text>
                  <View style={styles.pickerRow}>
                    {(['Low', 'Medium', 'High'] as const).map(p => (
                      <TouchableOpacity 
                        key={p} 
                        style={[styles.pickerBtn, priority === p && { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                        onPress={() => setPriority(p)}
                      >
                        <Text style={[styles.pickerBtnText, priority === p && { color: theme.primary }]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={styles.label}>Status</Text>
              <View style={styles.pickerRow}>
                {(['Pending', 'In Progress', 'Completed'] as const).map(s => (
                  <TouchableOpacity 
                    key={s} 
                    style={[styles.pickerBtn, status === s && { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                    onPress={() => setStatus(s)}
                  >
                    <Text style={[styles.pickerBtnText, status === s && { color: theme.primary }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
                  <TextInput 
                    style={styles.input} 
                    value={startDate} 
                    onChangeText={setStartDate} 
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
                  <TextInput 
                    style={styles.input} 
                    value={dueDate} 
                    onChangeText={setDueDate} 
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>

              <Text style={styles.label}>Category</Text>
              <TextInput 
                style={styles.input} 
                value={category} 
                onChangeText={setCategory} 
                placeholder="General" 
                placeholderTextColor={theme.textSecondary}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={isSubmitting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitBtn, (!title.trim() || isSubmitting) && styles.submitBtnDisabled]} 
                onPress={saveTodo} 
                disabled={!title.trim() || isSubmitting}
              >
                <Text style={styles.submitBtnText}>{isSubmitting ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.cardBgSolid,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filterContainer: {
    backgroundColor: theme.cardBgSolid,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0,
    gap: 6,
    backgroundColor: theme.cardBgSolid,
    marginRight: 8,
  },
  filterChipActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary + '10',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  filterChipTextActive: {
    color: theme.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: theme.cardBgSolid,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardCompleted: {
    opacity: 0.7,
    backgroundColor: theme.cardBg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 12,
  },
  cardHeaderTitle: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: theme.textSecondary,
  },
  cardExpandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border + '50',
  },
  todoDesc: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 0,
    borderWidth: 1,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 12,
  },
  metaText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardExpandedActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 0,
  },
  actionBtnOutlineText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 0, // strict adherence to rules
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', // slide up from bottom
  },
  modalContainer: {
    backgroundColor: theme.cardBgSolid,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: '90%',
    position: 'relative',
  },
  modalGradientStrip: {
    height: 6,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginTop: 6, // avoid gradient strip
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    fontSize: 14,
    color: theme.textPrimary,
    marginBottom: 16,
    borderRadius: 0,
  },
  textArea: {
    height: 80,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  pickerBtn: {
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.inputBg,
  },
  pickerBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.textSecondary,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.cardBgSolid,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: 'bold',
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
});

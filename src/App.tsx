import React, { useState, useEffect } from "react";
import {
  Check,
  Trash2,
  Plus,
  Calendar,
  ListFilter,
  X,
  Pencil, // 수정 아이콘 추가
  // AlertCircle
} from "lucide-react";

/**
 * ------------------------------------------------------------------
 * Types & Interfaces
 * ------------------------------------------------------------------
 */
type Priority = "low" | "medium" | "high";

// 요구사항에 맞춰 createdAt을 string으로 변경
interface Todo {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

interface TodoFormData {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
}

/**
 * ------------------------------------------------------------------
 * Mock API Service
 * 실제 백엔드 연동 시 fetch/axios로 교체될 부분입니다.
 * ------------------------------------------------------------------
 */
const mockApi = {
  async getTodos(): Promise<Todo[]> {
    // API Call Placeholder: GET /api/todos
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = localStorage.getItem("todos");
        resolve(data ? JSON.parse(data) : []);
      }, 300);
    });
  },

  async createTodo(todoData: TodoFormData): Promise<Todo> {
    // API Call Placeholder: POST /api/todos
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTodo: Todo = {
          id: Math.random().toString(36).substr(2, 9),
          ...todoData,
          completed: false,
          createdAt: new Date().toISOString(), // string 타입으로 저장
        };
        const currentTodos = JSON.parse(localStorage.getItem("todos") || "[]");
        const updatedTodos = [...currentTodos, newTodo];
        localStorage.setItem("todos", JSON.stringify(updatedTodos));
        resolve(newTodo);
      }, 300);
    });
  },

  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    // API Call Placeholder: PUT /api/todos/:id
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentTodos: Todo[] = JSON.parse(
          localStorage.getItem("todos") || "[]"
        );
        const updatedTodos = currentTodos.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        );
        localStorage.setItem("todos", JSON.stringify(updatedTodos));
        const updated = updatedTodos.find((t) => t.id === id);
        resolve(updated!);
      }, 200);
    });
  },

  async deleteTodo(id: string): Promise<void> {
    // API Call Placeholder: DELETE /api/todos/:id
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentTodos: Todo[] = JSON.parse(
          localStorage.getItem("todos") || "[]"
        );
        const updatedTodos = currentTodos.filter((t) => t.id !== id);
        localStorage.setItem("todos", JSON.stringify(updatedTodos));
        resolve();
      }, 200);
    });
  },

  async deleteCompletedTodos(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentTodos: Todo[] = JSON.parse(
          localStorage.getItem("todos") || "[]"
        );
        const updatedTodos = currentTodos.filter((t) => !t.completed);
        localStorage.setItem("todos", JSON.stringify(updatedTodos));
        resolve();
      }, 200);
    });
  },
};

/**
 * ------------------------------------------------------------------
 * Components
 * ------------------------------------------------------------------
 */

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  // 스타일 가이드: High(Red), Medium(Yellow), Low(Green)
  const styles = {
    high: "bg-red-100 text-red-700 border-red-200", // #EF4444 계열
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200", // #F59E0B 계열
    low: "bg-green-100 text-green-700 border-green-200", // #10B981 계열
  };

  const labels = {
    low: "낮음",
    medium: "보통",
    high: "높음",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[priority]}`}
    >
      {labels[priority]}
    </span>
  );
};

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [sort, setSort] = useState<"date" | "priority">("date");

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // 수정 중인 Todo ID
  const [formData, setFormData] = useState<TodoFormData>({
    title: "",
    description: "",
    priority: "medium",
    dueDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const data = await mockApi.getTodos();
      setTodos(data);
    } catch (error) {
      console.error("Failed to fetch todos", error);
    } finally {
      setLoading(false);
    }
  };

  // 모달 열기 (생성 모드)
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      dueDate: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  // 모달 열기 (수정 모드)
  const openEditModal = (todo: Todo) => {
    setEditingId(todo.id);
    setFormData({
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      dueDate: todo.dueDate,
    });
    setIsModalOpen(true);
  };

  // 폼 제출 (생성 또는 수정)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      // 수정 로직
      try {
        setTodos((prev) =>
          prev.map((t) => (t.id === editingId ? { ...t, ...formData } : t))
        ); // 낙관적 업데이트
        await mockApi.updateTodo(editingId, formData);
        setIsModalOpen(false);
        setEditingId(null);
      } catch (error) {
        console.error("Failed to update todo", error);
        loadTodos();
      }
    } else {
      // 생성 로직
      try {
        const newTodo = await mockApi.createTodo(formData);
        setTodos((prev) => [...prev, newTodo]);
        setIsModalOpen(false);
      } catch (error) {
        console.error("Failed to create todo", error);
      }
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !currentStatus } : t))
      );
      await mockApi.updateTodo(id, { completed: !currentStatus });
    } catch (error) {
      console.error("Failed to toggle todo", error);
      loadTodos();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      setTodos((prev) => prev.filter((t) => t.id !== id));
      await mockApi.deleteTodo(id);
    } catch (error) {
      console.error("Failed to delete todo", error);
      loadTodos();
    }
  };

  const handleClearCompleted = async () => {
    if (!window.confirm("완료된 모든 항목을 삭제하시겠습니까?")) return;
    try {
      setTodos((prev) => prev.filter((t) => !t.completed));
      await mockApi.deleteCompletedTodos();
    } catch (error) {
      console.error("Failed to clear completed", error);
      loadTodos();
    }
  };

  const getFilteredAndSortedTodos = () => {
    let result = [...todos];

    if (filter === "active") result = result.filter((t) => !t.completed);
    if (filter === "completed") result = result.filter((t) => t.completed);

    result.sort((a, b) => {
      if (sort === "date") {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else {
        const priorityScore = { high: 3, medium: 2, low: 1 };
        return priorityScore[b.priority] - priorityScore[a.priority];
      }
    });

    return result;
  };

  const filteredTodos = getFilteredAndSortedTodos();
  const activeCount = todos.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Check className="text-white w-5 h-5" strokeWidth={3} />
            </div>
            <h1 className="text-xl font-bold text-gray-800">TodoMate</h1>
          </div>
          <div className="text-sm text-gray-500">
            할 일{" "}
            <span className="font-bold text-indigo-600">{activeCount}</span>개
            남음
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex bg-gray-200 p-1 rounded-lg">
            {(["all", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {f === "all" ? "전체" : f === "active" ? "진행중" : "완료됨"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "date" | "priority")}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date">마감일순</option>
              <option value="priority">우선순위순</option>
            </select>

            {todos.some((t) => t.completed) && (
              <button
                onClick={handleClearCompleted}
                className="text-xs text-red-500 hover:text-red-700 underline px-2"
              >
                완료 삭제
              </button>
            )}
          </div>
        </div>

        {/* Todo List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : filteredTodos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ListFilter className="text-gray-400 w-8 h-8" />
            </div>
            <p className="text-gray-500">할 일이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">
              새로운 할 일을 추가해보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`group bg-white p-4 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md flex items-start gap-4 ${
                  todo.completed ? "bg-gray-50" : ""
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(todo.id, todo.completed)}
                  className={`flex-shrink-0 mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    todo.completed
                      ? "bg-indigo-500 border-indigo-500"
                      : "border-gray-300 hover:border-indigo-400"
                  }`}
                >
                  {todo.completed && <Check className="w-4 h-4 text-white" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <PriorityBadge priority={todo.priority} />
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {todo.dueDate}
                    </span>
                  </div>
                  <h3
                    className={`font-medium text-gray-900 break-words ${
                      todo.completed ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {todo.title}
                  </h3>
                  {todo.description && (
                    <p
                      className={`text-sm text-gray-500 mt-1 break-words ${
                        todo.completed ? "line-through text-gray-400" : ""
                      }`}
                    >
                      {todo.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(todo)}
                    className="text-gray-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    title="수정"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={openCreateModal}
        className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 z-20"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? "할 일 수정" : "새로운 할 일"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="할 일을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none h-24"
                  placeholder="상세 내용을 입력하세요 (선택)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    우선순위
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as Priority,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">보통</option>
                    <option value="high">높음</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    마감일
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md shadow-indigo-200 transition-colors"
                >
                  {editingId ? "수정하기" : "추가하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

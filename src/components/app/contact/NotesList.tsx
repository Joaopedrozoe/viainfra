import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash } from "lucide-react";
import { Note, Task } from "@/types/contact";

interface NotesListProps {
  contactId: string | undefined;
}

export const NotesList = ({ contactId }: NotesListProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [newTask, setNewTask] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      content: newNote,
      tasks: [],
      createdAt: new Date().toISOString()
    };
    
    setNotes([note, ...notes]);
    setNewNote("");
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId));
  };

  const handleDeleteTask = (noteId: string, taskId: string) => {
    setNotes(notes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          tasks: note.tasks.filter(task => task.id !== taskId)
        };
      }
      return note;
    }));
  };

  const handleAddTask = (noteId: string) => {
    if (!newTask.trim()) return;
    
    const task: Task = {
      id: Date.now().toString(),
      text: newTask,
      completed: false
    };
    
    setNotes(notes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          tasks: [...note.tasks, task]
        };
      }
      return note;
    }));
    
    setNewTask("");
    setShowAddTask(null);
  };

  const handleNoteChange = (noteId: string, newContent: string) => {
    setNotes(notes.map(note => 
      note.id === noteId ? { ...note, content: newContent } : note
    ));
  };

  const handleTaskChange = (noteId: string, taskId: string, newText: string) => {
    setNotes(notes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          tasks: note.tasks.map(task => 
            task.id === taskId ? { ...task, text: newText } : task
          )
        };
      }
      return note;
    }));
  };

  const toggleTask = (noteId: string, taskId: string) => {
    setNotes(notes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          tasks: note.tasks.map(task => {
            if (task.id === taskId) {
              return { ...task, completed: !task.completed };
            }
            return task;
          })
        };
      }
      return note;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Textarea
          placeholder="Adicionar nota..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[100px]"
        />
        <Button onClick={handleAddNote}>Adicionar nota</Button>
      </div>

      <div className="space-y-4">
        {notes.map((note) => (
          <Card key={note.id} className="p-4">
            <div className="flex items-start gap-2">
              <Checkbox 
                checked={note.tasks.every(task => task.completed)} 
                onCheckedChange={() => {
                  setNotes(notes.map(n => {
                    if (n.id === note.id) {
                      return {
                        ...n,
                        tasks: n.tasks.map(task => ({
                          ...task,
                          completed: !note.tasks.every(t => t.completed)
                        }))
                      };
                    }
                    return n;
                  }));
                }}
              />
              <div className="flex-1">
                <div className="bg-gray-50 p-4 rounded-t-md border-b border-gray-200">
                  <Textarea
                    value={note.content}
                    onChange={(e) => handleNoteChange(note.id, e.target.value)}
                    className="min-h-[60px] bg-transparent border-none p-0 focus-visible:ring-0"
                  />
                </div>

                <div className="bg-white p-4 rounded-b-md space-y-2">
                  {note.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(note.id, task.id)}
                        />
                        <Textarea
                          value={task.text}
                          onChange={(e) => handleTaskChange(note.id, task.id, e.target.value)}
                          className={`min-h-[32px] bg-transparent border-none p-0 focus-visible:ring-0 resize-none ${
                            task.completed ? "line-through text-gray-500" : ""
                          }`}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDeleteTask(note.id, task.id)}
                      >
                        <Trash className="h-4 w-4 text-gray-500 hover:text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>

                {showAddTask === note.id ? (
                  <div className="mt-4 space-y-2">
                    <Textarea
                      placeholder="Adicionar tarefa..."
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAddTask(note.id)}>
                        Adicionar tarefa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddTask(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowAddTask(note.id)}
                  >
                    Adicionar tarefa
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleDeleteNote(note.id)}
              >
                <Trash className="h-4 w-4 text-gray-500 hover:text-red-500" />
              </Button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              {new Date(note.createdAt).toLocaleDateString()}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

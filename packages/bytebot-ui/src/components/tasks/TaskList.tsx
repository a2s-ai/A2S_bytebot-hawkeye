"use client";

import React, { useEffect, useState, useCallback } from "react";
import { TaskItem } from "@/components/tasks/TaskItem";
import { fetchTasks } from "@/utils/taskUtils";
import { Task } from "@/types";
import { useWebSocket } from "@/hooks/useWebSocket";

interface TaskListProps {
  limit?: number;
  className?: string;
  title?: string;
  description?: string;
  showHeader?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({ 
  limit = 5, 
  className = "", 
  title = "Latest Tasks",
  description,
  showHeader = true,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // WebSocket handlers for real-time updates
  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  }, []);

  const handleTaskCreated = useCallback((newTask: Task) => {
    setTasks(prev => {
      const updated = [newTask, ...prev];
      return updated.slice(0, limit);
    });
  }, [limit]);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  // Initialize WebSocket for task list updates
  useWebSocket({
    onTaskUpdate: handleTaskUpdate,
    onTaskCreated: handleTaskCreated,
    onTaskDeleted: handleTaskDeleted,
  });

  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const result = await fetchTasks({ limit });
        setTasks(result.tasks);
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [limit]);

  return (
    <div className={className}>
      {showHeader && (
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      
      {isLoading ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm dark:border-border/60 dark:bg-muted">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-foreground"></div>
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center dark:border-border/40 dark:bg-muted/30">
          <p className="text-sm font-medium text-foreground">No tasks available</p>
          <p className="mt-1 text-xs text-muted-foreground">Your tasks will appear here once created</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

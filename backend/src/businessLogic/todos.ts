import { TodoItem } from "../models/TodoItem";
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { TodoAccess } from "../dataLayer/todoAccess";
const todoAccess = new TodoAccess();

export const deleteTodo = async (userId: string, todoId: string) => {
    await todoAccess.deleteTodo(userId, todoId);
}

export const getTodosForUser = async (userId: string): Promise<TodoItem[]> => {
    const todos = await todoAccess.getUserTodos(userId);
    return todos;
}

export const createTodo = async (data: CreateTodoRequest, userId: string): Promise<TodoItem> => {
    const todoItem = await todoAccess.createTodo(data, userId);
    return todoItem;
}

export const updateTodo = async (data: UpdateTodoRequest, userId: string, todoId: string) => {
    await todoAccess.updateTodo(data, userId, todoId);
}

export const createAttachmentPresignedUrl = async (userId: string, todoId: string) => {
    const uploadUrl = todoAccess.createAttachment(userId, todoId);
    return uploadUrl;
}
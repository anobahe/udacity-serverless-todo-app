import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as AWS from "aws-sdk";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import { TodoItem } from "../models/TodoItem";
import { v4 } from "uuid";

const AWSXRay = require("aws-xray-sdk");
const XAWS = AWSXRay.captureAWS(AWS);

export class TodoAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly s3 = new XAWS.S3({ signatureVersion: "v4" }),
        private readonly todosTable: string = process.env.TODOS_TABLE,
        private readonly s3Bucket: string = process.env.ATTACHMENT_S3_BUCKET,
        private readonly urlExpiration: number = +process.env.SIGNED_URL_EXPIRATION
    ) {}

    async deleteTodo(userId: string, todoId: string) {
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            }
        }).promise();
    }

    async getUserTodos(userId: string): Promise<TodoItem[]> {
        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();
        const todos = result.Items;
        return todos as TodoItem[];
    }

    async createTodo(data: CreateTodoRequest, userId: string) {
        const todoItem: TodoItem = {
            todoId: v4(),
            createdAt: new Date().toISOString(),
            done: false,
            userId,
            ...data
        }
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todoItem
        }).promise();
        return todoItem;
    }

    async updateTodo(data: UpdateTodoRequest, userId: string, todoId: string) {
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            },
            UpdateExpression: "Set #name=:name, dueDate=:dueDate, done=:done",
            ExpressionAttributeValues: {
                ":name": data.name,
                ":dueDate": data.dueDate,
                ":done": data.done
            },
            ExpressionAttributeNames: {
                "#name": "name"
            }
        }).promise();
    }

    async createAttachment(userId: string, todoId: string) {
        const uploadUrl = this.getSignedUrl(todoId);
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            },
            UpdateExpression: "Set attachmentUrl=:attachmentUrl",
            ExpressionAttributeValues: {
                ":attachmentUrl": `https://${this.s3Bucket}.s3.amazonaws.com/${todoId}`
            }
        }).promise();
        return uploadUrl;
    }

    async getSignedUrl(todoId: string) {
        return this.s3.getSignedUrl("putObject", {
            Bucket: this.s3Bucket,
            Key: todoId,
            Expires: this.urlExpiration
        });
    }
}
import pb from '@/lib/pocketbase/client'
import type { TaskRecord } from '@/types/review'

const collection = pb.collection('tasks')
export const listTasks = () =>
  collection.getFullList<TaskRecord>({ sort: '-created', expand: 'review_id' })
export const createTask = (data: Partial<TaskRecord>) =>
  collection.create<TaskRecord>({ ...data, user_id: pb.authStore.record?.id, status: 'pendente' })
export const updateTaskStatus = (id: string, status: TaskRecord['status']) =>
  collection.update<TaskRecord>(id, { status })

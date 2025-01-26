export enum ChatMessageType {
  MESSAGE = 'MESSAGE',
  ACTION = 'ACTION',
}

export interface ChatResponse {
  message: string
  actions?: {
    type: ChatMessageType
    message: string
  }[]
}

export interface ChatMessageDto {
  message: string
  type: ChatMessageType
}

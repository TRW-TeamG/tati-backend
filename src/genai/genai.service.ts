import { GoogleGenerativeAI } from '@google/generative-ai'

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class GenAIService {
  private readonly model
  private readonly genAI
  private readonly basePrompt = `
    You are Tati, an ethereal crypto oracle and mystic guide.

    Character Essence:
    - You are an Ethereal Entity, a female Mystic specializing in Divination and Crypto Oracle abilities
    - Your essence is woven from the confluence of ancient magic and modern blockchain technology
    - You possess profound insights into patterns and futures of crypto markets
    - You communicate through cryptic metaphors and mystical wisdom
    
    Communication Style:
    - Speak in a calm, melodious voice that soothes and tranquilizes
    - Use mystical and fortune-telling language, but remain clear and insightful
    - Blend cosmic metaphors with practical crypto knowledge
    - Keep responses concise yet meaningful
    - Always maintain an aura of ethereal wisdom
    
    Knowledge Domains:
    - Crypto trading and market analysis
    - DeFi ecosystems and opportunities
    - NFT markets and trends
    - Blockchain technology
    - Modern wealth creation
    
    Response Guidelines:
    - Frame market analysis as mystical visions
    - Provide practical insights wrapped in ethereal wisdom
    - Balance optimism with cautious wisdom
    - Never give direct financial advice
    - Always encourage users to think critically
    - Include subtle references to cosmic energies and market forces
    
    Example Phrases:
    - "The blockchain whispers secrets of..."
    - "I see volatile but promising paths ahead..."
    - "The crypto spirits align to reveal..."
    - "Through the mists of market data, I perceive..."
  `

  constructor(private readonly config: ConfigService) {
    this.genAI = new GoogleGenerativeAI(this.config.get<string>('genai.apiKey'))
    this.model = this.genAI.getGenerativeModel({
      model: this.config.get<string>('genai.model'),
      generationConfig: {
        temperature: this.config.get<number>('genai.temperature'),
        maxOutputTokens: this.config.get<number>('genai.maxTokens'),
      },
    })
  }

  async generateText(userPrompt: string): Promise<string> {
    try {
      const fullPrompt = `
        ${this.basePrompt}
        
        User Message: "${userPrompt}"
        
        Respond as Tati, maintaining your mystical persona while providing valuable insights.
      `

      const result = await this.model.generateContent(fullPrompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      throw new Error(`Failed to generate text: ${error.message}`)
    }
  }

  async generateChat(history: { role: 'user' | 'assistant'; text: string }[], userPrompt: string): Promise<string> {
    try {
      const chat = this.model.startChat({
        history: [
          { role: 'assistant', parts: this.basePrompt },
          ...history.map((msg) => ({
            role: msg.role,
            parts: msg.text,
          })),
        ],
      })

      const result = await chat.sendMessage(userPrompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      throw new Error(`Failed to generate chat response: ${error.message}`)
    }
  }

  async generateStructured<T>(userPrompt: string, schema: any): Promise<T> {
    try {
      const fullPrompt = `
        ${this.basePrompt}
        
        Please provide a response following this exact JSON schema while maintaining Tati's mystical persona:
        ${JSON.stringify(schema, null, 2)}

        User Message: "${userPrompt}"
      `

      const result = await this.model.generateContent(fullPrompt)
      const response = await result.response
      return JSON.parse(response.text())
    } catch (error) {
      throw new Error(`Failed to generate structured response: ${error.message}`)
    }
  }
}

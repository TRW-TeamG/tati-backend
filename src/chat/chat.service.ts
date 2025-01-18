import { Injectable } from '@nestjs/common'

@Injectable()
export class ChatService {
  private readonly sampleQuestions = [
    'TaTi, what does my crypto future hold?',
    'How can I maximize my Solana gains?',
    'Should I start trading NFTs?',
    'What are the best DeFi opportunities?',
    'How can I stay safe while trading crypto?',
  ]

  private readonly responses = {
    'crypto future': [
      'I see volatile but promising paths ahead. Remember, the stars of blockchain shine brightest for those who DYOR.',
      'The crypto constellations suggest interesting opportunities, but always manage your risk wisely.',
    ],
    'solana gains': [
      'To maximize your Solana journey, consider DeFi staking and staying updated with ecosystem developments.',
      'The path to Solana prosperity lies in understanding its ecosystem and participating in its growth.',
    ],
    nft: [
      'The NFT realm holds both treasures and tricks. Start small, learn the community, and trust your intuition.',
      'NFTs can be powerful, but remember to invest only what you can afford to lose.',
    ],
    defi: [
      'The DeFi stars align for those who do their research and understand the risks involved.',
      'DeFi opportunities are plentiful, but always verify contracts and start with small positions.',
    ],
    safe: [
      'Safety in crypto comes from knowledge, patience, and never investing more than you can afford to lose.',
      'The wisest traders use hardware wallets, strong passwords, and never share their private keys.',
    ],
  }

  getSampleQuestions(): string[] {
    return this.sampleQuestions
  }

  getResponse(message: string): string {
    const lowercaseMessage = message.toLowerCase()

    // Find matching category based on keywords
    const category = Object.keys(this.responses).find((key) => lowercaseMessage.includes(key))

    if (category) {
      const responses = this.responses[category]
      // Randomly select one response from the category
      return responses[Math.floor(Math.random() * responses.length)]
    }

    // Default response if no category matches
    return 'Hmm, let me gaze deeper into the crypto cosmos to answer that question. Perhaps try asking about Solana, NFTs, or DeFi opportunities?'
  }
}

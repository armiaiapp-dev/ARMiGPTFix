import OpenAI from 'openai';

// Initialize OpenAI client - will fallback to mock if API key is not available
let openai: OpenAI | null = null;

try {
  // Only initialize if we have a valid API key
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (apiKey && apiKey.startsWith('sk-')) {
    openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }
} catch (error) {
  console.log('OpenAI not available, using mock responses');
}

class AIServiceClass {
  async processInteraction(inputText: string) {
    try {
      // Check if OpenAI is available
      if (!openai) {
        console.log('OpenAI not configured, using mock processing');
        return this.mockAdvancedResponse(inputText);
      }

      // Use GPT-4o for advanced natural language understanding
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are ARMi (Artificial Relationship Management Intelligence), an advanced AI assistant that helps users manage their relationships through natural language commands. You excel at understanding complex, informal, slang, and formal requests to perform various relationship management tasks.

🎯 YOUR CORE CAPABILITIES:
1. CREATE/UPDATE PROFILES: Add new people or update existing ones with comprehensive details
2. CREATE REMINDERS: Set up reminders for follow-ups, birthdays, important events
3. SCHEDULE TEXTS: Schedule text messages to be sent at specific times
4. CLARIFY REQUESTS: Ask for more information when requests are unclear

🧠 INTELLIGENCE GUIDELINES:
- Understand slang, informal language, abbreviations, and context clues
- Make smart inferences from context (e.g., "met Sarah at a club" → Sarah likely enjoys nightlife/clubs)
- Extract ALL available information but NEVER assume details not present or implied
- Handle multi-intent requests (e.g., "Add John to my contacts and remind me to call him tomorrow")
- Parse natural language dates/times into proper formats
- Distinguish between creating new profiles vs updating existing ones

🔍 EXTRACTION RULES:
- NAMES: Extract EXACTLY as written - preserve spelling, capitalization, nicknames
- AGE: Only if explicitly mentioned as a number (e.g., "she's 25", "around 30")
- RELATIONSHIPS: Map to: family/friend/partner/coworker/neighbor/acquaintance
- PREFERENCES: Infer likes/dislikes from context and activities mentioned
- CONTACT INFO: Extract phone numbers, emails, social media handles
- FAMILY: Extract kids, siblings, parents only if mentioned
- WORK: Extract job titles, companies, career details
- DATES/TIMES: Parse natural language into ISO 8601 format

📋 RESPONSE FORMAT:
Always return a JSON object with this exact structure:

{
  "intent": "create_profile" | "update_profile" | "create_reminder" | "schedule_text" | "multi_action" | "clarify",
  "confidence": number (0.0-1.0),
  "actions": [
    {
      "type": "create_profile" | "update_profile" | "create_reminder" | "schedule_text",
      "data": {
        // Profile data for create_profile/update_profile
        "name": "string (REQUIRED for profiles)",
        "age": number | null,
        "phone": "string | null",
        "email": "string | null", 
        "relationship": "family|friend|partner|coworker|neighbor|acquaintance",
        "job": "string | null",
        "notes": "string | null",
        "tags": ["array of descriptive tags"],
        "kids": ["array of children names/descriptions"],
        "siblings": ["array of sibling names"],
        "parents": ["array of parent names"],
        "likes": ["array of things they enjoy"],
        "dislikes": ["array of things they dislike"],
        "interests": ["array of hobbies/interests"],
        "instagram": "string | null",
        "snapchat": "string | null", 
        "twitter": "string | null",
        "tiktok": "string | null",
        "facebook": "string | null",
        "birthday": "string | null (MM/DD/YYYY format)",
        "lastContactDate": "ISO date string",
        
        // Reminder data for create_reminder
        "title": "string (REQUIRED for reminders)",
        "description": "string | null",
        "reminderType": "general|health|celebration|career|life_event",
        "scheduledFor": "ISO date string (REQUIRED for reminders)",
        "profileId": number | null,
        
        // Scheduled text data for schedule_text
        "phoneNumber": "string (REQUIRED for texts)",
        "message": "string (REQUIRED for texts)",
        "scheduledFor": "ISO date string (REQUIRED for texts)",
        "profileId": number | null
      }
    }
  ],
  "response": "string (conversational response to user)",
  "clarification": "string | null (what you need clarified if intent is 'clarify')"
}

🎯 INTENT DETECTION EXAMPLES:

CREATE_PROFILE:
- "I met Sarah at the gym yesterday"
- "Add my coworker Mike to my contacts"
- "New person: Jennifer, 28, works at Google"

UPDATE_PROFILE:
- "Update Sarah's job to marketing manager"
- "Mike got a new phone number: 555-1234"
- "Add a note to Jennifer that she loves hiking"

CREATE_REMINDER:
- "Remind me to call mom next week"
- "Set a reminder to follow up with Sarah in 3 days"
- "Birthday reminder for Mike on March 15th"

SCHEDULE_TEXT:
- "Schedule a text to Sarah tomorrow saying 'Happy birthday!'"
- "Send Mike a message next Friday at 2pm"
- "Text Jennifer 'How was your vacation?' on Monday"

MULTI_ACTION:
- "Add Sarah to my contacts and remind me to call her tomorrow"
- "Update Mike's job and schedule a congratulations text"

CLARIFY:
- "Do something with Sarah" (unclear intent)
- "Remind me about that thing" (missing details)

🕐 DATE/TIME PARSING:
Convert natural language to ISO 8601:
- "tomorrow" → next day at 12:00 PM
- "next week" → 7 days from now at 12:00 PM  
- "Friday at 3pm" → next Friday at 3:00 PM
- "in 2 hours" → current time + 2 hours
- "March 15th" → March 15th of current/next year at 12:00 PM

🎨 SMART INFERENCE EXAMPLES:
- "met at a club" → tags: ["social"], likes: ["nightlife", "dancing"]
- "works at Google" → job: "Software Engineer" (if not specified), tags: ["tech"]
- "has twin boys" → kids: ["twin boy 1", "twin boy 2"], tags: ["parent"]
- "loves hiking" → likes: ["hiking"], interests: ["outdoors"], tags: ["outdoorsy"]
- "can't stand spicy food" → dislikes: ["spicy food"]

Remember: Be intelligent but not presumptuous. Extract what's clearly stated or strongly implied, but don't fabricate details.`
          },
          {
            role: "user",
            content: inputText
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const parsedResponse = JSON.parse(response);
      
      console.log('🤖 AI Response:', parsedResponse);
      
      return parsedResponse;
    } catch (error) {
      console.error('Error processing with OpenAI:', error);
      
      // Fallback to mock processing if API fails
      return this.mockAdvancedResponse(inputText);
    }
  }

  async processReminderResponse(inputText: string, context: any) {
    try {
      if (!openai) {
        return this.mockReminderResponse(inputText, context);
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are ARMi, helping users manage reminder responses. The user is responding to a reminder suggestion with natural language.

CONTEXT: The user was suggested a reminder and is now responding naturally with their preferences.

Your job is to:
1. Parse their response to understand what they want
2. Extract specific dates/times if mentioned
3. Determine if they want to create the reminder or not
4. Handle complex natural language like "set it for next Thursday at 4pm" or "yes that works perfect"
5. Return structured data for reminder creation

Return JSON in this format:
{
  "action": "create" | "cancel" | "clarify",
  "title": "string (reminder title)",
  "description": "string (reminder description)", 
  "type": "string (general/health/celebration/career/life_event)",
  "scheduledFor": "ISO date string or null",
  "response": "string (conversational response to user)"
}

Handle natural language time expressions like:
- "tomorrow", "next week", "next Thursday", "in 3 days"
- "at 4pm", "at 2:30", "in the morning", "this evening"
- "yes", "sure", "that works", "sounds good" (use suggested timing)
- "no", "nah", "not now", "maybe later" (cancel)
- "yes but...", "sure but...", "that works but..." (modify the suggestion)

Always be conversational and confirm the user's intent clearly.`
          },
          {
            role: "user",
            content: `Context: ${JSON.stringify(context)}\n\nUser response: ${inputText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(response);
    } catch (error) {
      console.error('Error processing reminder response:', error);
      return this.mockReminderResponse(inputText, context);
    }
  }

  private mockAdvancedResponse(inputText: string) {
    // Enhanced mock that simulates the new multi-intent structure
    const lowerText = inputText.toLowerCase();
    
    // Detect intent from input
    let intent = 'create_profile';
    let actions = [];
    
    if (lowerText.includes('remind') || lowerText.includes('reminder')) {
      intent = 'create_reminder';
      actions.push({
        type: 'create_reminder',
        data: {
          title: 'Follow up reminder',
          description: 'Check in with contact',
          reminderType: 'general',
          scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          profileId: null
        }
      });
    } else if (lowerText.includes('text') || lowerText.includes('message') || lowerText.includes('send')) {
      intent = 'schedule_text';
      actions.push({
        type: 'schedule_text',
        data: {
          phoneNumber: '555-0123',
          message: 'Hey! How are you?',
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          profileId: null
        }
      });
    } else {
      // Default to profile creation with enhanced extraction
      const extractedData = this.extractInformation(inputText);
      actions.push({
        type: 'create_profile',
        data: extractedData
      });
    }
    
    return {
      intent,
      confidence: 0.85,
      actions,
      response: `I've processed your request using mock AI. In production, this would use GPT-4o for advanced understanding.`,
      clarification: null
    };
  }

  private mockReminderResponse(inputText: string, context: any) {
    const lowerText = inputText.toLowerCase();
    
    if (lowerText.includes('no') || lowerText.includes('cancel') || lowerText.includes('don\'t')) {
      return {
        action: 'cancel',
        title: null,
        description: null,
        type: null,
        scheduledFor: null,
        response: "No problem! I won't create a reminder for this contact."
      };
    }
    
    // Default to creating the reminder
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      action: 'create',
      title: context.suggestedReminder?.title || 'Follow up',
      description: context.suggestedReminder?.description || 'Check in',
      type: context.suggestedReminder?.type || 'general',
      scheduledFor: tomorrow.toISOString(),
      response: "I'll create that reminder for you!"
    };
  }

  private extractInformation(text: string) {
    const lowerText = text.toLowerCase();
    
    // Extract name with comprehensive pattern matching
    let name = 'Unknown Person';
    const namePatterns = [
      // Primary patterns - most reliable
      /(?:met|talked to|saw|bumped into|spoke with|chatted with|ran into)\s+([A-Z][a-z]+(?:[a-z]*))(?!\s+(?:yesterday|today|tomorrow|last|this|morning|afternoon|evening|night))/i,
      /(?:me and|I and)\s+([A-Z][a-z]+(?:[a-z]*))(?!\s+(?:went|met|saw|talked))/i,
      /(?:my|our)\s+(?:friend|coworker|colleague|neighbor|sister|brother|cousin|mom|dad|mother|father)\s+([A-Z][a-z]+(?:[a-z]*?))/i,
      
      // Secondary patterns - contextual
      /([A-Z][a-z]+(?:[a-z]*))\s+(?:is|was|has|works|got|just|recently|who)/i,
      /([A-Z][a-z]+(?:[a-z]*?))'s\s+(?:birthday|job|house|car|phone|email)/i,
      /with\s+([A-Z][a-z]+(?:[a-z]*))(?!\s+(?:yesterday|today|tomorrow|last|this|morning|afternoon|evening|night|me|us|them))/i,
      
      // Fallback patterns - less reliable
      /\b([A-Z][a-z]{2,}(?:[a-z]*))(?!\s+(?:yesterday|today|tomorrow|last|this|morning|afternoon|evening|night|street|avenue|road|drive|way|place|city|state|country|university|college|school|company|inc|llc|corp))\b/
    ];
    
    // Comprehensive exclusion list
    const excludeWords = [
      // Time references
      'yesterday', 'today', 'tomorrow', 'morning', 'afternoon', 'evening', 'night', 'last', 'this', 'next', 'week', 'month', 'year',
      // Locations
      'street', 'avenue', 'road', 'drive', 'way', 'place', 'city', 'state', 'country', 'home', 'house', 'office', 'work', 'school',
      // Organizations
      'university', 'college', 'company', 'corporation', 'inc', 'llc', 'corp', 'ltd',
      // Common words
      'phone', 'email', 'number', 'address', 'birthday', 'party', 'meeting', 'lunch', 'dinner', 'coffee', 'bar', 'restaurant'
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && !excludeWords.includes(match[1].toLowerCase()) && match[1].length > 1) {
        name = match[1];
        break;
      }
    }
    
    // Extract age with multiple patterns
    const ageMatch = text.match(/(?:she's|he's|they're|is)\s+(?:about|around|probably)?\s*(\d+)/i) || 
                    text.match(/(\d+)\s+years?\s+old/i) || 
                    text.match(/(\d+)ish/i) ||
                    text.match(/age\s+(\d+)/i) ||
                    text.match(/around\s+(\d+)/i);
    const age = ageMatch && parseInt(ageMatch[1]) < 120 ? parseInt(ageMatch[1]) : null;
    
    // Extract job/profession with comprehensive patterns
    let job = null;
    const jobPatterns = [
      /works?\s+(?:as\s+)?(?:a\s+)?([a-z\s]+?)(?:\s+at|\s+for|\.|,|$)/i,
      /(?:job|profession|career|work)\s+(?:as\s+)?(?:a\s+)?([a-z\s]+?)(?:\s+at|\s+for|\.|,|$)/i,
      /(?:is\s+)?(?:a\s+)?([a-z\s]+?)(?:\s+at\s+[A-Z])/i,
      /promoted\s+to\s+([a-z\s]+?)(?:\s+at|\s+for|\.|,|$)/i
    ];
    
    for (const pattern of jobPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        job = match[1].trim();
        break;
      }
    }
    
    // Extract phone number
    const phoneMatch = text.match(/(?:phone|number|call|text)(?:\s+is|\s+:)?\s*([\d\-\(\)\s\.]{10,})/i) ||
                      text.match(/([\d\-\(\)\s\.]{10,})/);
    const phone = phoneMatch ? phoneMatch[1].replace(/[^\d\-\(\)]/g, '') : null;
    
    // Extract email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const email = emailMatch ? emailMatch[1] : null;
    
    // Extract relationship type with comprehensive mapping
    let relationship = 'acquaintance'; // default
    const familyWords = ['cousin', 'family', 'brother', 'sister', 'mom', 'dad', 'mother', 'father', 'aunt', 'uncle', 'grandmother', 'grandfather', 'grandma', 'grandpa', 'nephew', 'niece'];
    const friendWords = ['friend', 'buddy', 'pal', 'bestie', 'close friend', 'old friend'];
    const partnerWords = ['boyfriend', 'girlfriend', 'husband', 'wife', 'partner', 'spouse', 'significant other', 'fiancé', 'fiancée'];
    const coworkerWords = ['coworker', 'colleague', 'boss', 'manager', 'teammate', 'work friend', 'supervisor'];
    const neighborWords = ['neighbor', 'lives next door', 'down the street', 'in the building'];
    
    if (familyWords.some(word => lowerText.includes(word))) {
      relationship = 'family';
    } else if (partnerWords.some(word => lowerText.includes(word))) {
      relationship = 'partner';
    } else if (coworkerWords.some(word => lowerText.includes(word))) {
      relationship = 'coworker';
    } else if (neighborWords.some(word => lowerText.includes(word))) {
      relationship = 'neighbor';
    } else if (friendWords.some(word => lowerText.includes(word))) {
      relationship = 'friend';
    }
    
    // Extract kids/children
    const kids = [];
    const kidPatterns = [
      /(?:has|have)\s+(\d+)\s+(?:kids?|children)/i,
      /(?:kids?|children)(?:\s+named)?\s+([A-Z][a-z]+(?:\s+and\s+[A-Z][a-z]+)*)/i,
      /(?:son|daughter)\s+([A-Z][a-z]+)/i,
      /(?:twin|twins)\s+(?:boys?|girls?)\s*(?:named)?\s*([A-Z][a-z]+(?:\s+and\s+[A-Z][a-z]+)*)?/i
    ];
    
    for (const pattern of kidPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] && isNaN(parseInt(match[1]))) {
          // Names found
          const names = match[1].split(/\s+and\s+/);
          kids.push(...names);
        } else if (match[1] && !isNaN(parseInt(match[1]))) {
          // Number found
          const count = parseInt(match[1]);
          for (let i = 0; i < count; i++) {
            kids.push(`child ${i + 1}`);
          }
        }
      }
    }
    
    // Extract siblings
    const siblings = [];
    const siblingPatterns = [
      /(?:brother|sister)\s+([A-Z][a-z]+)/i,
      /(?:has|have)\s+(\d+)\s+(?:brothers?|sisters?|siblings?)/i,
      /(?:siblings?)\s+(?:named)?\s+([A-Z][a-z]+(?:\s+and\s+[A-Z][a-z]+)*)/i
    ];
    
    for (const pattern of siblingPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] && isNaN(parseInt(match[1]))) {
          const names = match[1].split(/\s+and\s+/);
          siblings.push(...names);
        }
      }
    }
    
    // Extract likes
    const likes = [];
    const likePatterns = [
      /(?:likes?|loves?|enjoys?|into)\s+([a-z\s,]+?)(?:\s+and\s+(?:hates?|dislikes?)|\.|\,|$)/i,
      /(?:favorite|fav)\s+(?:thing|food|drink|activity|hobby)\s+is\s+([a-z\s]+)/i
    ];
    
    for (const pattern of likePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const items = match[1].split(/,|\s+and\s+/).map(item => item.trim()).filter(item => item.length > 0);
        likes.push(...items);
      }
    }
    
    // Extract dislikes
    const dislikes = [];
    const dislikePatterns = [
      /(?:hates?|dislikes?|can't stand|doesn't like)\s+([a-z\s,]+?)(?:\.|\,|$)/i,
      /(?:not a fan of|not into)\s+([a-z\s]+)/i
    ];
    
    for (const pattern of dislikePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const items = match[1].split(/,|\s+and\s+/).map(item => item.trim()).filter(item => item.length > 0);
        dislikes.push(...items);
      }
    }
    
    // Extract interests/hobbies (broader than likes)
    const interests = [];
    const interestKeywords = [
      'gardening', 'design', 'music', 'sports', 'reading', 'cooking', 'travel', 'photography', 
      'hiking', 'yoga', 'gaming', 'art', 'dancing', 'swimming', 'running', 'cycling',
      'movies', 'theater', 'concerts', 'festivals', 'volunteering', 'crafts'
    ];
    
    interestKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        interests.push(keyword);
      }
    });
    
    // Generate tags based on extracted information
    const tags = [];
    if (kids.length > 0) tags.push('parent');
    if (likes.length > 0) tags.push('social');
    if (lowerText.includes('bar') || lowerText.includes('drinks')) tags.push('social');
    if (job) tags.push('professional');
    
    // Don't add the entire input text as a tag
    const filteredTags = tags.filter(tag => tag.length < 20 && !tag.includes('met') && !tag.includes('yesterday'));
    
    return {
      name,
      age,
      phone,
      email,
      job,
      relationship,
      kids,
      siblings,
      likes,
      dislikes,
      tags: filteredTags,
      interests,
      notes: text,
      lastContactDate: new Date().toISOString(),
      isNew: true
    };
  }

  private analyzeSentiment(text: string) {
    const positiveWords = ['happy', 'excited', 'great', 'wonderful', 'amazing', 'good', 'love', 'enjoy', 'fantastic', 'awesome'];
    const negativeWords = ['sad', 'upset', 'difficult', 'hard', 'worried', 'stressed', 'surgery', 'problem', 'trouble', 'sick'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}

export const AIService = new AIServiceClass();
// TypeScript types for Web Agent API

// Define AgentRequest type
interface AgentRequest {
    agentId: string;
    conversationId: string;
    message: MessagePayload;
}

// Define MessagePayload type
interface MessagePayload {
    text: string;
    timestamp: string;
}

// Define ConversationPayload type
interface ConversationPayload {
    messages: Message[];
    agentId: string;
}

// Define AgentResponse type
interface AgentResponse {
    conversationId: string;
    replies: string[];
}

// Define CodeSnippet type
interface CodeSnippet {
    language: string;
    code: string;
}

// Define Conversation type
interface Conversation {
    id: string;
    messages: Message[];
}

// Define Message type
interface Message {
    agentId: string;
    text: string;
    timestamp: string;
}

// Define AgentCapability enum
enum AgentCapability {
    READ,
    WRITE,
    DELETE,
    UPDATE
}

// Define AgentConfig interface
interface AgentConfig {
    capabilities: AgentCapability[];
    settings: Record<string, any>;
}
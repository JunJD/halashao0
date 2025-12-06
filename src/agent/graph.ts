import { BaseMessage, SystemMessage, AIMessage, HumanMessage, ToolMessage, FunctionMessage } from '@langchain/core/messages';
import { StateGraph, START, END, Annotation, MemorySaver } from '@langchain/langgraph';
import { createChatModel } from '@/utils/ai-model';
import { layoutNode } from './layoutNode';

// Define the state schema
export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  intent: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  view_tree: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  elements: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  final_design: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
});

// Initialize the model (configurable via env)
const model = createChatModel();

// Node 1: Chat / Intent Understanding
async function chatNode(state: typeof AgentState.State) {
  const { messages } = state;
  // const lastMsg = messages.at(-1);

  // System prompt to guide the intent extraction
  const systemPrompt = `You are Halas, an intelligent design assistant.
  Analyze the user's request.
  If the user wants to create, modify, or generate a design (poster, image, layout, text), begin your response with "DESIGN_INTENT: " followed by a summary of what to design.
  If the user is just chatting, respond normally.
  
  Example:
  User: "Make a poster for a coffee shop."
  Assistant: "DESIGN_INTENT: A promotional poster for a coffee shop."
  
  User: "Hi there."
  Assistant: "Hello! How can I help you with your designs today?"
  `;

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    ...messages,
  ]);

  const content = response.content as string;
  let intent = '';

  if (content.includes('DESIGN_INTENT:')) {
    intent = content.split('DESIGN_INTENT:')[1].trim();
    return {
      messages: [new AIMessage({ content: `I'm working on a design for: ${intent}`, id: response.id })],
      intent,
    };
  }

  return { messages: [response], intent: '' };
}

// Node 2: Generate View/Text/Image tree (React Native JSX, not JSON)
async function genjsx(state: typeof AgentState.State) {
  const { intent } = state;
  if (!intent) return {};

  const prompt = `You are a UI layout generator. Based on the design intent: "${intent}", output a minimal React Native JSX component tree (not JSON).

Requirements:
- Use only React Native primitives supported by react-sketchapp: View, Text, Image, Svg.
- Use inline style with absolute positioning when needed: style={{ left, top, width, height, backgroundColor }}.
- For Text, include fontSize, color, and textAlign in style.
- For Image, use source={{ uri: 'data:image/...base64...' }} or src="..."; include style with width/height and left/top.
- The root should be a container View with width/height and backgroundColor in style.
- Keep values simple (numbers, hex colors). Do not import or reference external components or packages.
- Output ONLY a fenced JSX code block (no prose, no explanations):

\`\`\`jsx
<View style={{ width: 800, height: 800, backgroundColor: '#ffffff' }}>
  <View style={{ left: 40, top: 40, width: 720, height: 720, backgroundColor: '#f5f5f5' }} />
  <Text style={{ left: 80, top: 120, fontSize: 36, color: '#111111', textAlign: 'left' }}>Some title</Text>
  <Image style={{ left: 100, top: 200, width: 400, height: 300 }} source={{ uri: 'data:image/png;base64,...' }} />
</View>
\`\`\``;

  const response = await model.invoke([new SystemMessage(prompt)]);
  // Keep the JSX in the message stream; layoutNode will parse the JSX block.

  const content = response.content || '';
  return {
    messages: [new AIMessage({ content })],
  };
}

// Node 3: Layout (Fabric JSON)
const layout = layoutNode;

// Routing
function route(state: typeof AgentState.State) {
  if (state.intent) {
    return 'genjsx';
  }
  return '__end__';
}

// Build Graph
const workflow = new StateGraph(AgentState)
  .addNode('chat_node', chatNode)
  .addNode('genjsx', genjsx)
  .addNode('layout', layout)

  .addEdge(START, 'chat_node')
  .addConditionalEdges('chat_node', route)
  .addEdge('genjsx', 'layout')
  .addEdge('layout', END);

// Export the graph
export const graph = workflow.compile({
  checkpointer: new MemorySaver(),
});

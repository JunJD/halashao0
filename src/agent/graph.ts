import { BaseMessage, SystemMessage, AIMessage, HumanMessage, ToolMessage, FunctionMessage } from '@langchain/core/messages';
import { StateGraph, START, END, Annotation, MemorySaver } from '@langchain/langgraph';
import { createChatModel } from '@/utils/ai-model';

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
async function chat_node(state: typeof AgentState.State) {
  const { messages } = state;
  const lastMsg = messages.at(-1);

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
    // We can refine the response to be more natural for the user
    return {
      messages: [new AIMessage({ content: `I'm working on a design for: ${intent}`, id: response.id })],
      intent,
    };
  }

  return { messages: [response], intent: '' };
}

// Node 2: Generate Visual Elements (GenJSX equivalent)
async function genjsx(state: typeof AgentState.State) {
  const { intent } = state;
  if (!intent) return {};

  const prompt = `Based on the design intent: "${intent}", generate a list of visual elements required.
  Return ONLY a raw JSON array of objects. Do not use Markdown blocks.
  Each object should have:
  - type: 'i-text' | 'rect' | 'circle' | 'image'
  - text: (for i-text)
  - fill: color string (hex)
  - width: number (approximate)
  - height: number (approximate)
  
  Example:
  [
    {"type": "rect", "fill": "#ff0000", "width": 100, "height": 100},
    {"type": "i-text", "text": "Coffee", "fill": "#000000", "fontSize": 40}
  ]`;

  const response = await model.invoke([new SystemMessage(prompt)]);

  let elements = [];
  try {
    // Attempt to clean and parse JSON
    const cleanContent = (response.content as string).replace(/```json/g, '').replace(/```/g, '').trim();
    elements = JSON.parse(cleanContent);
  } catch (e) {
    console.error('Failed to parse genjsx output', e);
    // Fallback
    elements = [{ type: 'i-text', text: intent, fill: '#000000' }];
  }

  return {
    elements,
    // detailed log for debug/CoT
    messages: [new AIMessage({ content: `Generated ${elements.length} elements based on intent.` })],
  };
}

// Node 3: Layout (Fabric JSON)
async function layout(state: typeof AgentState.State) {
  const { elements } = state;
  if (!elements || elements.length === 0) return {};

  const prompt = `You are a layout engine. Canvas size is 800x800.
  Arrange the following elements into a beautiful composition:
  ${JSON.stringify(elements)}
  
  Return ONLY a raw JSON object representing a partial Fabric.js canvas export.
  The structure must be:
  {
    "objects": [
      { ...element_properties, left: number, top: number }
    ]
  }
  Ensure no elements overlap in a bad way. Center main text.
  Do not use Markdown blocks.`;

  const response = await model.invoke([new SystemMessage(prompt)]);

  let final_design = null;
  try {
    const cleanContent = (response.content as string).replace(/```json/g, '').replace(/```/g, '').trim();
    final_design = JSON.parse(cleanContent);
  } catch (e) {
    console.error('Failed to parse layout output', e);
  }

  return {
    // eslint-disable-next-line camelcase
    final_design,
    messages: [new AIMessage(`Here is your design:\n\`\`\`json\n${JSON.stringify(final_design)}\n\`\`\``)],
  };
}

// Routing
function route(state: typeof AgentState.State) {
  if (state.intent) {
    return 'genjsx';
  }
  return '__end__';
}

// Build Graph
const workflow = new StateGraph(AgentState)
  .addNode('chat_node', chat_node)
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

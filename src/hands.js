// The lenses that come with the god's hands; the hands themselves live in tooldefs.js.
import { addLens } from './main.js';
import { TOOL_LENSES } from './tooldefs.js';
for (const [id, label] of TOOL_LENSES) addLens(id, label);

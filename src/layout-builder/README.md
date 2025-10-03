# Drag-and-Drop Layout Builder

A freeform, drag-and-drop layout builder that gives administrators full control over component positioning and sizing with absolute positioning and pixel-perfect control.

## Features

### ✅ Core Functionality
- **Freeform Canvas**: Absolute positioning with 4px grid snapping
- **Component Palette**: 5 draggable component types (Text Field, Text Area, Picklist, Checkbox, Section)
- **Drag & Drop**: From palette to canvas with visual feedback
- **Component Movement**: Click and drag to reposition components
- **Resize System**: 8-point resize handles with grid snapping
- **Selection System**: Visual feedback for selected components
- **Overlap Control**: Toggle to allow/prevent component overlap
- **Component Management**: Remove individual components or clear all
- **Data Persistence**: JSON export/import functionality

### ✅ Cross-Platform Support
- **Desktop**: Full mouse support (mousedown, mousemove, mouseup)
- **Mobile**: Full touch support (touchstart, touchmove, touchend)
- **Responsive**: Desktop sidebar + mobile top layout
- **Unified Events**: Single codebase handles both input methods

### ✅ Visual Design
- **Grid System**: 4px grid with subtle background pattern
- **Component Types**: Visual differentiation (sections have dashed borders)
- **Selection States**: Blue borders and glow effects
- **Smooth Animations**: Real-time feedback during interactions

## File Structure

```
src/layout-builder/
├── index.html          # Main HTML structure
├── styles.css         # Complete CSS styling
├── script.js          # JavaScript functionality
└── README.md          # This documentation
```

## Usage

1. **Open** `index.html` in a modern web browser
2. **Drag components** from the left palette to the canvas
3. **Click and drag** to move components around
4. **Use resize handles** to adjust component size
5. **Toggle overlap** to control component positioning
6. **Save layouts** as JSON data
7. **Clear all** to start over

## Component Types

| Type | Description | Default Size | Visual Style |
|------|-------------|--------------|--------------|
| Text Field | Single line input | 200×80px | White background, solid border |
| Text Area | Multi-line input | 200×80px | White background, solid border |
| Picklist | Dropdown selection | 200×80px | White background, solid border |
| Checkbox | Boolean field | 200×80px | White background, solid border |
| Section | Container/grouping | 300×200px | Gray background, dashed border |

## Data Structure

Each component is stored as a JSON object:

```json
{
  "id": 1234567890,
  "type": "text|textarea|picklist|checkbox|section",
  "label": "Component Label",
  "x": 100,
  "y": 200,
  "width": 200,
  "height": 80,
  "options": ["Option 1", "Option 2"]  // for picklist only
}
```

## Technical Implementation

### Grid Snapping
- All positions and sizes snap to 4px grid
- Ensures consistent alignment and professional appearance
- Applied during drag, drop, move, and resize operations

### Overlap Control
- **Allow Overlap ON**: Components can freely overlap
- **Allow Overlap OFF**: Components cannot overlap, auto-resolves existing overlaps
- Real-time collision detection during interactions

### Touch Support
- Full mobile touch support with `{ passive: false }`
- Touch targets sized appropriately for mobile (44px minimum)
- Unified event handling for mouse and touch

### Performance
- Real-time DOM updates for smooth interactions
- Efficient collision detection
- No framework dependencies - pure vanilla JavaScript

## Browser Support

- Modern browsers with ES6+ support
- Touch events for mobile devices
- CSS Grid and Flexbox support
- No external dependencies

## Future Enhancements

- Nested sections (sections containing other components)
- Component properties panel (edit labels, options, etc.)
- Undo/Redo functionality
- Keyboard shortcuts
- Component duplication
- Multi-select and group operations
- Alignment guides (snap to other components)
- Export/Import layouts
- Templates and presets

## Development Notes

- Pure HTML, CSS, and vanilla JavaScript
- No external libraries or frameworks
- In-memory storage only (no localStorage)
- Designed for modern browsers
- Mobile-first responsive design

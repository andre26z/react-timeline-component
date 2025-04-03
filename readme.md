# React Timeline Component

A React component for visualizing items on a horizontal timeline with interactive features.

# <a href=https://react-timeline-component-teal.vercel.app/> Live Demo </a>

# Project Image

![image](https://github.com/user-attachments/assets/43f4c9a0-457e-4aa2-bf2a-4624455ab5c3)


## Running the Project

1. Install dependencies: `npm install`
2. Start the development server: `npm start`

## Features

- **Compact Layout**: Items are arranged in lanes efficiently using the provided `assignLanes` utility
- **Interactive UI**:
  - Zoom in/out controls (0.5x to 3x)
  - Drag and drop to reposition items
  - Resize items by dragging left/right edges
  - Edit item names with double-click
  - View details in a modal with single click
- **Visual Design**:
  - Month-based headers and grid
  - Color-coded items based on ID patterns
  - Hover effects and animations
  - Dark theme UI

## What I Like About My Implementation

- The UI is intuitive with smooth interactions for manipulating timeline items
- The component handles different time ranges dynamically, calculating proper proportions
- Visual cues (colors, shadows, animations) enhance usability and provide feedback
- The code separates concerns well between layout calculation, event handling, and rendering

## Design Decisions

The implementation was inspired by project management tools and Gantt charts. Key decisions include:

- Using lane allocation algorithm to efficiently arrange items horizontally
- Implementing direct manipulation through drag-and-drop and resize handles
- Using a dark color scheme for better visual hierarchy and reduced eye strain
- Providing visual feedback (hover states, shadows) to indicate interactive elements

## Testing Approach

With more time, I would implement:

- Unit tests for date calculations and lane assignment
- Integration tests for interactive features (drag, resize, edit)
- Browser compatibility testing
- Performance testing with large datasets


# Personal Website V2

Interactive 3D visualization of research topics and papers, featuring a Matrix-style interface. Visit [bpacton.com](https://bpacton.com) to see it live.

## Features

- Matrix-style falling characters that transform into network visualizations
- Interactive 3D topic exploration
- Connected paper visualization for each research topic
- Dynamic transitions and animations
- Responsive design

## Tech Stack

- Next.js 13.4
- React Three Fiber / Three.js
- TypeScript
- Tailwind CSS

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# The server will start on port 3000 by default and automatically use the next
# available port if 3000 is already in use.

# Build for production
npm run build
```

## Deployment

This site is automatically deployed to [bpacton.com](https://bpacton.com) via Vercel when changes are pushed to the main branch.

## Project Structure

- `src/app`: Next.js app router pages
- `src/components`: React components including 3D visualizations
- `src/data`: Research topic and paper data
- `src/lib`: Utility functions and shared code

## To-Do List

### High Priority
- [ ] Fix and enhance the guided tour functionality
  - [ ] Properly integrate with existing topic and paper elements
  - [ ] Ensure smooth camera transitions between tour stops
  - [ ] Add more detailed narration for each research topic

### Medium Priority
- [ ] Add more research papers and topics
- [ ] Improve mobile experience
- [ ] Add search functionality for papers
- [ ] Create a dedicated publications page

### Future Enhancements
- [ ] Add interactive demos of research concepts
- [ ] Implement a blog section
- [ ] Create visualization of research timeline
- [ ] Add citation generator for papers
- [ ] Implement collaboration network visualization

## Performance Optimization
- [ ] Implement level-of-detail rendering for complex visualizations
- [ ] Add loading states with progress indicators
- [ ] Optimize for different device capabilities

## Accessibility
- [ ] Add alternative navigation methods
- [ ] Ensure keyboard navigation for all interactive elements
- [ ] Improve screen reader compatibility

# VingVis - FTC/FRC Robot Code Generator

A no-code/low-code visual programming platform for FTC/FRC robotics teams. Build autonomous robot programs using a node-based visual editor inspired by n8n and Google Opal.

## Features

- **Visual Node-Based Editor**: Drag and drop nodes to create robot programs
- **Project Templates**: Pre-configured templates for 4 Omni-Wheel and 4 Mecanum-Wheel drivetrains
- **Motor Configuration**: Custom motor naming (fl, fr, bl, br or custom names)
- **Code Export**: Generate ready-to-use Java code for FTC Robot Controller
- **Waitlist System**: Join the waitlist with your FTC team information
- **Authentication Required**: Dashboard requires authentication (no guest mode)
- **Project Management**: Create up to 3 projects per authenticated user
- **Team Sharing**: Future support for share-in-team mode and subscriptions

## Setup Instructions

### 1. Database Setup

Run the SQL schema in your Supabase dashboard:

```bash
# Navigate to your Supabase project > SQL Editor
# Copy and paste the contents of supabase-schema.sql
# Execute the SQL commands
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note**: The `SUPABASE_SERVICE_ROLE_KEY` is required for the waitlist API to work properly. You can find it in your Supabase project settings under "API".

### 3. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## User Flow

### 1. Waitlist Signup
- Navigate to `/waitlist` (or `/login` or `/signin` - all redirect to waitlist)
- Enter your FTC Team information:
  - FTC Team Name
  - FTC Team ID
  - Gmail Address
- Submit to join the waitlist
- You'll receive a confirmation and be notified when access is granted

### 2. Dashboard (Requires Authentication)
- Navigate to `/dashboard` (requires authentication)
- If not authenticated, you'll be redirected to `/waitlist`
- Once authenticated, see all your projects (max 3)
- Create a new project by clicking the "Create New Project" card

### 3. Create Project
- Choose a project name
- Select a robot template:
  - **4 Omni-Wheel Drive**: Standard omni-directional robot
  - **4 Mecanum-Wheel Drive**: Holonomic drive system
- Configure motor names (defaults: fl, fr, bl, br)

### 4. Visual Editor
- Access via `/dashboard/{username}/{projecthash}`
- **Add Nodes**: Click nodes in the left panel to add to canvas
  - **Start**: Entry point for your program
  - **Move**: Move robot forward/backward
  - **Turn**: Rotate robot
  - **Wait**: Delay execution
  - **Action**: Trigger robot actions
  - **Custom Code**: Add custom Java code
- **Connect Nodes**: Drag from one node's edge to another to create connections
- **Configure Nodes**: Click a node to see configuration panel on the right
- **Save**: Save your workflow to the database
- **Export Code**: Generate and download Java code for FTC Robot Controller

## Node Types

### Move Node
- **Power**: Motor power (0-1)
- **Duration**: How long to move (milliseconds)

### Turn Node
- **Power**: Motor power (0-1)
- **Duration**: How long to turn (milliseconds)

### Wait Node
- **Duration**: How long to wait (milliseconds)

### Custom Code Node
- **Code**: Enter custom Java code to be inserted

## Code Export

The visual editor generates FTC-compatible Java code:

1. Click "Export Code" in the editor
2. A `.java` file will be downloaded
3. Add the file to your FTC Robot Controller project
4. The code includes:
   - Motor declarations based on your configuration
   - Proper motor directions for your drivetrain type
   - Sequential execution of your nodes
   - Ready-to-run autonomous program

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui, Radix UI
- **Visual Editor**: ReactFlow
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion

## Database Schema

### Waitlist Table
- `id`: UUID (primary key)
- `ftc_team_name`: Text (required)
- `ftc_team_id`: Text (required)
- `email`: Text (unique, required)
- `created_at`: Timestamp

### Users Table
- `id`: UUID (primary key)
- `email`: Text (unique)
- `username`: Text (unique)
- `ftc_team_name`: Text (optional)
- `ftc_team_id`: Text (optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Projects Table
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users)
- `project_hash`: Text (unique identifier for URLs)
- `name`: Text
- `template_type`: Enum ('omni-wheel', 'mecanum-wheel')
- `motor_config`: JSONB (motor name mappings)
- `workflow_data`: JSONB (nodes and edges)
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Future Features

- **Team Collaboration**: Share projects with team members
- **Subscriptions**: Premium features and increased project limits
- **More Node Types**: Sensor inputs, conditionals, loops
- **FTC DECODE Season Assets**: Field elements and game-specific actions
- **Code Preview**: Live preview of generated code
- **Simulation**: Test your robot program in a virtual environment
- **Template Library**: Community-shared robot programs

## Support

For issues or questions, please create an issue in the GitHub repository.

## License

MIT License - see LICENSE file for details

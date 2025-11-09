# VingVis Advanced Path Planning - New Features

## Overview

VingVis has been completely redesigned with a powerful drag-and-drop interface inspired by Google Opal and OpenAI Agent Kit, featuring advanced path planning capabilities for both PedroPathing and RoadRunner.

## Major Features

### 1. Custom Node-Based Drag-and-Drop Editor

**NO ReactFlow dependency!** We built a custom canvas-based node editor from scratch with:

- **Drag-and-drop nodes**: Create complex autonomous routines by connecting action nodes
- **Visual workflow**: See your entire autonomous program as a connected graph
- **Pan and zoom**: Navigate large workflows with smooth camera controls
- **Connection system**: Draw curved connections between nodes with arrows
- **Real-time updates**: Instant visual feedback as you build your routine

**Usage:**
- Click and drag nodes to reposition them
- Click on output connectors (right side) and drag to input connectors (left side) to connect
- Use mouse wheel to zoom in/out
- Middle-click or space+drag to pan the canvas
- Select nodes to view configuration options

### 2. Interactive Field Canvas with Draggable Waypoints

Transform your path planning with an intuitive field visualization:

#### Features:
- **Drag waypoints**: Click and drag any waypoint to reposition
- **Bézier curve handles**: Drag control points to shape smooth curves
- **Double-click to add**: Double-click anywhere on the field to add a new waypoint
- **Heading indicators**: Yellow arrows show robot orientation at each point
- **Real-time path preview**: See your path update as you edit
- **Velocity visualization**: Color-coded path showing speed at each point
- **Undo/Redo**: Full history support for waypoint edits

#### Path Types:
1. **Linear**: Straight line between waypoints
2. **Spline**: Smooth curved path (Catmull-Rom spline)
3. **Bézier**: Cubic Bézier curves with full control point manipulation

**Usage:**
- Double-click on field to add waypoints
- Drag waypoints to move them
- Select a waypoint and click "Bezier" to convert to bezier curve
- Drag the purple control handles to adjust curve shape
- Delete selected waypoint with the trash button

### 3. Enhanced PedroPathing Code Generation

Generate production-ready PedroPathing code with advanced features:

#### New Capabilities:
- **PathBuilder API**: Modern API with fluent syntax
- **PathChain support**: Sequential path execution
- **BezierCurve**: Full cubic Bézier curve support with control points
- **BezierLine**: Optimized straight-line paths
- **Custom constraints**: Per-waypoint velocity and acceleration limits
- **Follower constants**: Fine-tune PIDF and movement parameters
- **Centripetal force correction**: Better curve following

#### Generated Code Includes:
```java
// PathBuilder with BezierCurve
path = follower.pathBuilder()
    .addPath(
        new BezierCurve(
            new Point(x1, y1, Point.CARTESIAN),
            new Point(cp1x, cp1y, Point.CARTESIAN),
            new Point(cp2x, cp2y, Point.CARTESIAN),
            new Point(x2, y2, Point.CARTESIAN)
        )
    )
    .setLinearHeadingInterpolation(startHeading, endHeading)
    .setPathEndVelocityConstraint(maxVel)
    .build();
```

**Configuration Options:**
- Max velocity (in/s)
- Max acceleration (in/s²)
- Max angular velocity (rad/s)
- Max angular acceleration (rad/s²)
- xMovement/yMovement PIDF constants
- Zero power acceleration constants

### 4. Enhanced RoadRunner Code Generation

Generate optimized RoadRunner trajectories:

#### Features:
- **TrajectorySequence**: Advanced trajectory building
- **Custom constraints**: Per-segment velocity/acceleration limits
- **Spline support**: Smooth splineToSplineHeading paths
- **Linear paths**: lineToLinearHeading for straight segments
- **Automatic turns**: Smart turn detection for point turns
- **Drive class support**: Both Mecanum and Tank drive

#### Generated Code:
```java
TrajectorySequence trajectorySequence = drive.trajectorySequenceBuilder(startPose)
    .setVelConstraint(velConstraint)
    .setAccelConstraint(accelConstraint)
    .splineToSplineHeading(
        new Pose2d(x, y, heading),
        tangent
    )
    .resetConstraints()
    .build();
```

**Configuration Options:**
- Max velocity/acceleration
- Max angular velocity/acceleration
- Track width
- Per-segment constraints

### 5. Real-Time Path Statistics

Get instant feedback on your autonomous routine:

- **Total distance**: Path length in inches
- **Estimated time**: Based on velocity profile
- **Max velocity**: Highest speed reached
- **Waypoint count**: Number of positions
- **Segment breakdown**: Linear vs spline vs bezier

### 6. Advanced UI Features

#### View Modes:
1. **Split View**: See both node editor and field canvas simultaneously
2. **Nodes Only**: Focus on workflow logic
3. **Field Only**: Maximize path editing space

#### Visualization Options:
- **Velocity overlay**: Color-coded speed visualization
- **Grid toggle**: Show/hide field grid
- **Path animation**: Preview robot movement along path
- **Animation speed control**: 0.5x to 2x playback

### 7. Path Editing Tools

Powerful tools for path manipulation:

- **Undo/Redo**: Full edit history
- **Convert to Bézier**: Transform linear segments to curves
- **Delete waypoint**: Remove selected points
- **Duplicate path**: Copy entire path (coming soon)
- **Reverse path**: Flip path direction (coming soon)
- **Split segment**: Divide path at midpoint (coming soon)

## Using the New System

### Quick Start:

1. **Open Project**: Navigate to your project in the dashboard
2. **Add Waypoints**: Double-click on the field to place waypoints
3. **Adjust Path**: Drag waypoints or convert to Bézier and adjust curves
4. **Configure Constraints**: Set velocity/acceleration in left sidebar
5. **Choose Path Library**: Select PedroPathing or RoadRunner
6. **Export Code**: Click "Export Code" to download Java file

### Node Editor:

1. **Add Nodes**: Drag from node palette (coming soon - currently integrated with waypoints)
2. **Connect Nodes**: Drag from output to input connectors
3. **Configure**: Select node to edit properties
4. **Build Flow**: Create complex sequences with parallel actions

### Field Canvas:

1. **Add Waypoint**: Double-click on field
2. **Move Waypoint**: Click and drag
3. **Adjust Heading**: Rotate robot icon (coming soon - currently set in properties)
4. **Create Curves**: Select waypoint, click "Bezier", drag control handles
5. **Delete**: Select waypoint and click trash icon

### Code Export:

1. **Configure Constraints**: Set max velocity, acceleration in sidebar
2. **Choose Library**: Select PedroPathing or RoadRunner
3. **Export Code**: Download autonomous OpMode
4. **Export Config**: Download configuration class with tuned constants

## Technical Details

### Architecture:

- **Custom Canvas Rendering**: No ReactFlow dependency, built with HTML5 Canvas
- **Real-time Updates**: Efficient state management with React hooks
- **Modular Code Generation**: Separate libraries for PedroPathing and RoadRunner
- **Type-safe**: Full TypeScript implementation

### Performance:

- Smooth 60 FPS canvas rendering
- Optimized path interpolation algorithms
- Efficient connection routing
- Minimal re-renders with React memoization

### File Structure:

```
/components
  ├── node-editor.tsx              # Custom node-based flow editor
  ├── interactive-field-canvas.tsx # Draggable waypoint field
  └── ...

/lib
  ├── pedropathing-codegen.ts     # PedroPathing code generator
  ├── roadrunner-codegen.ts       # RoadRunner code generator
  └── ...

/app/dashboard/[username]/[projecthash]
  ├── page.tsx                     # New integrated editor
  └── page-backup-original.tsx    # Original version (backup)
```

## Comparison with Pedro-Pathing Visualizer

### Similar Features:
- ✅ Drag-and-drop waypoint editing
- ✅ Bézier curve support with control handles
- ✅ Real-time path visualization
- ✅ Code generation for autonomous
- ✅ Velocity visualization

### VingVis Advantages:
- ✅ Node-based workflow editor (like Google Opal)
- ✅ Dual support: PedroPathing AND RoadRunner
- ✅ Custom constraints per waypoint
- ✅ Advanced PathBuilder API support
- ✅ Integrated hardware configuration
- ✅ Project management and cloud save
- ✅ Multi-view editing (split, nodes, field)

## Future Enhancements

Coming soon:
- [ ] Path recording from gamepad input
- [ ] Multi-robot simulation
- [ ] Obstacle avoidance visualization
- [ ] Team collaboration features
- [ ] Video path overlay
- [ ] Path optimization suggestions

## Support

For issues or feature requests:
- GitHub: https://github.com/GCMinerva/VingVis/issues
- Documentation: https://vingvis.com/docs

---

**Built with ❤️ for the FTC community**

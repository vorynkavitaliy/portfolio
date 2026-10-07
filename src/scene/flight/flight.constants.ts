export const CRUISE_SPEED = 13;
export const BOOST_SPEED = 26;
export const AUTOPILOT_NEAR_SPEED = 8;
export const AUTOPILOT_NEAR_RADIUS = 40;

export const TURN_RATE = 1.15;
export const TURN_RESPONSE = 5;
export const PITCH_GAIN = 0.5;
export const PITCH_RESPONSE = 2.5;
export const ROLL_GAIN = 0.75;
export const ROLL_RESPONSE = 3;
export const SPEED_RESPONSE = 1.5;

export const GROUND_CLEARANCE = 4;
export const GROUND_LOOKAHEAD = 6;
export const CLIMB_ASSIST_OFFSET = 3;
export const CLIMB_ASSIST_RANGE = 6;
export const GROUND_RECOVERY = 6;
export const FLOOR_CLEARANCE = 2.5;

export const CEILING_SOFT = 72;
export const CEILING_SOFT_RANGE = 8;
export const CEILING = 80;

export const EDGE_MARGIN = 18;
export const EDGE_RATE_BASE = 0.6;
export const EDGE_RATE_GAIN = 0.08;
export const EDGE_RATE_MAX = 2.4;
export const MAX_DT = 0.05;

export const ORBIT_RADIUS = 13;
export const ORBIT_ANGULAR_SPEED = 0.3;
export const ORBIT_SPEED = ORBIT_RADIUS * ORBIT_ANGULAR_SPEED;
export const ORBIT_HEIGHT = 10;
export const ORBIT_START_ANGLE = 0.75 * Math.PI;
export const ORBIT_TURN_BIAS = 0.26;
export const ORBIT_TURN_GAIN = 2.5;
export const ORBIT_RADIUS_GAIN = 0.1;
export const ORBIT_CLIMB_RANGE = 6;
export const ORBIT_MIN_RADIUS = 0.01;

export const HOME_STATION = 0;
export const LINK_RANGE = 15;
export const UNLINK_RANGE = 24;
export const DOCK_DISTANCE = 10;
export const HOME_DOCK_DISTANCE = 26;
export const DOCK_HEIGHT = 6;
export const HOME_DOCK_HEIGHT = 7;
export const DOCK_GROUND_CLEARANCE = 4;
export const DOCK_MIN_OFFSET_SQ = 0.01;
export const DOCK_NEIGHBOUR_MARGIN = 3;
export const DOCK_NEIGHBOUR_CLEARANCE = LINK_RANGE + DOCK_NEIGHBOUR_MARGIN;
export const DOCK_BEARINGS = 8;
export const TAKEOFF_GRACE_DISTANCE = LINK_RANGE;
export const DOCK_RESPONSE = 1.3;
export const DOCK_YAW_RESPONSE = 2.2;
export const DOCK_ROLL_GAIN = 6;
export const DOCK_ROLL_RESPONSE = 3;

export const AUTOPILOT_CLEARANCE = 9;
export const AUTOPILOT_LOOKAHEAD_NEAR = 14;
export const AUTOPILOT_LOOKAHEAD_FAR = 28;
export const AUTOPILOT_CRUISE_RADIUS = 30;
export const AUTOPILOT_TURN_GAIN = 2.2;
export const AUTOPILOT_CLIMB_RANGE = 8;
export const AUTOPILOT_ARRIVED = 0.5;
export const AUTOPILOT_CANCEL = 0.35;

export const STEER_DEAD_ZONE = 0.12;
export const STICK_RADIUS = 56;

export const CAMERA_FLOOR = 2.5;

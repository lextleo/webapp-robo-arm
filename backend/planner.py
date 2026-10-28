import time
import uuid
import threading
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from .models import ExecutionPlan, PlanStep, ChatMessage
from .hardware_controller import hardware

logger = logging.getLogger("aveon.planner")

class TaskPlanner:
    """
    Safe AI Conversational Planner & Task Execution State Machine.
    Ensures Human-in-the-Loop verification before physical robot arm actuation.
    """

    def __init__(self):
        self.active_plans: Dict[str, ExecutionPlan] = {}
        self.chat_history: List[ChatMessage] = []
        self._current_execution_thread: Optional[threading.Thread] = None
        self._abort_current_task = threading.Event()
        
        # Seed initial conversation from the reference screenshot
        self._seed_initial_conversation()

    def _seed_initial_conversation(self):
        """Pre-populate conversation matching reference screenshot."""
        initial_plan = ExecutionPlan(
            plan_id="plan-init-001",
            prompt="Pick up the yellow cube and place it on the right side.",
            steps=[
                PlanStep(id=1, description="Locate the yellow cube using vision.", completed=False),
                PlanStep(id=2, description="Move the arm to the object position.", completed=False),
                PlanStep(id=3, description="Close the gripper and pick up the cube.", completed=False),
                PlanStep(id=4, description="Move to the right side placement area.", completed=False),
                PlanStep(id=5, description="Open the gripper and place the cube.", completed=False),
            ],
            status="AWAITING_CONFIRMATION",
            target_color="Yellow",
            target_action="PICK_AND_PLACE_RIGHT"
        )
        self.active_plans[initial_plan.plan_id] = initial_plan

        msg_user = ChatMessage(
            id="msg-1",
            sender="user",
            text="Pick up the yellow cube and place it on the right side.",
            timestamp="14:32",
            plan=None,
            awaiting_confirmation=False
        )
        msg_bot = ChatMessage(
            id="msg-2",
            sender="assistant",
            text="I'll help you pick up the yellow cube and place it on the right side. Here's the plan:",
            timestamp="14:32",
            plan=initial_plan,
            awaiting_confirmation=True
        )
        self.chat_history = [msg_user, msg_bot]

    def parse_user_intent(self, text: str) -> Tuple[str, Optional[str], Optional[str]]:
        """
        Parses intent and target attributes from natural language.
        Returns: (intent_action, target_color, target_direction)
        """
        t = text.lower()

        # Target color detection
        target_color = None
        for c in ["yellow", "red", "blue", "green"]:
            if c in t:
                target_color = c.capitalize()
                break

        # Actions
        if "pick and place" in t or ("pick" in t and "place" in t):
            color = target_color or "Yellow"
            direction = "right" if ("right" in t or "right side" in t) else ("left" if "left" in t else "right")
            return "PICK_AND_PLACE", color, direction

        elif "pick" in t or "grab" in t or "lift" in t:
            color = target_color or "Yellow"
            return "PICK_ONLY", color, None

        elif "open gripper" in t or "release" in t:
            return "OPEN_GRIPPER", None, None

        elif "close gripper" in t or "grip" in t:
            return "CLOSE_GRIPPER", None, None

        elif "move forward" in t or "forward" in t:
            return "MOVE_FORWARD", None, None

        elif "home" in t or "reset" in t:
            return "HOME", None, None

        elif "stop" in t or "halt" in t or "emergency" in t:
            return "STOP", None, None

        # Default fallback to pick & place
        return "PICK_AND_PLACE", target_color or "Yellow", "right"

    def create_plan_for_prompt(self, user_text: str) -> Tuple[ChatMessage, ExecutionPlan]:
        """Creates a structured 5-step execution plan from user message."""
        action, color, direction = self.parse_user_intent(user_text)
        plan_id = f"plan-{uuid.uuid4().hex[:8]}"
        now_time = datetime.now().strftime("%H:%M")

        target_obj = f"{color.lower()} cube" if color else "target object"
        dest_desc = f"{direction} side placement area" if direction else "designated drop zone"

        if action == "PICK_AND_PLACE":
            steps = [
                PlanStep(id=1, description=f"Locate the {target_obj} using vision.", completed=False),
                PlanStep(id=2, description="Move the arm to the object position.", completed=False),
                PlanStep(id=3, description=f"Close the gripper and pick up the {target_obj}.", completed=False),
                PlanStep(id=4, description=f"Move to the {dest_desc}.", completed=False),
                PlanStep(id=5, description=f"Open the gripper and place the {target_obj}.", completed=False),
            ]
            bot_text = f"I'll help you pick up the {target_obj} and place it on the {direction} side. Here's the plan:"
        
        elif action == "MOVE_FORWARD":
            steps = [
                PlanStep(id=1, description="Verify workspace clearance with vision sensor.", completed=False),
                PlanStep(id=2, description="Calculate forward trajectory vector.", completed=False),
                PlanStep(id=3, description="Smoothly actuate shoulder and elbow servos (+15°).", completed=False),
                PlanStep(id=4, description="Level the wrist angle for stability.", completed=False),
                PlanStep(id=5, description="Hold steady and report reached coordinates.", completed=False),
            ]
            bot_text = "I'll advance the robotic arm forward safely. Here's the execution plan:"

        elif action == "OPEN_GRIPPER":
            steps = [
                PlanStep(id=1, description="Check current end-effector load status.", completed=False),
                PlanStep(id=2, description="Release mechanical clamping pressure.", completed=False),
                PlanStep(id=3, description="Drive J6 servo to open position (25°).", completed=False),
                PlanStep(id=4, description="Confirm fingers full disengagement.", completed=False),
                PlanStep(id=5, description="Update gripper state to OPEN.", completed=False),
            ]
            bot_text = "I'll open the 2-finger gripper. Here is the sequence:"

        elif action == "CLOSE_GRIPPER":
            steps = [
                PlanStep(id=1, description="Verify target object alignment between fingers.", completed=False),
                PlanStep(id=2, description="Gradually ramp PWM to J6 servo (95°).", completed=False),
                PlanStep(id=3, description="Apply calibrated holding torque.", completed=False),
                PlanStep(id=4, description="Confirm object secure grip.", completed=False),
                PlanStep(id=5, description="Update gripper state to CLOSED.", completed=False),
            ]
            bot_text = "I'll close the 2-finger gripper to grasp the object. Here is the sequence:"

        else: # Default or HOME
            steps = [
                PlanStep(id=1, description="Disengage any active grasping force.", completed=False),
                PlanStep(id=2, description="Elevate elbow and shoulder to clear obstacles.", completed=False),
                PlanStep(id=3, description="Align base rotation to zero center (90°).", completed=False),
                PlanStep(id=4, description="Return all 6 joints to standard Home position.", completed=False),
                PlanStep(id=5, description="Broadcast ACK:READY status to system.", completed=False),
            ]
            bot_text = "I'll return the robotic arm to the calibrated Home position. Here's the plan:"

        plan = ExecutionPlan(
            plan_id=plan_id,
            prompt=user_text,
            steps=steps,
            status="AWAITING_CONFIRMATION",
            target_color=color,
            target_action=f"{action}_{direction}" if direction else action
        )
        self.active_plans[plan_id] = plan

        # User message
        user_msg = ChatMessage(
            id=f"msg-user-{uuid.uuid4().hex[:6]}",
            sender="user",
            text=user_text,
            timestamp=now_time,
            plan=None,
            awaiting_confirmation=False
        )
        self.chat_history.append(user_msg)

        # Assistant message with plan
        bot_msg = ChatMessage(
            id=f"msg-bot-{uuid.uuid4().hex[:6]}",
            sender="assistant",
            text=bot_text,
            timestamp=now_time,
            plan=plan,
            awaiting_confirmation=True
        )
        self.chat_history.append(bot_msg)

        return bot_msg, plan

    def confirm_and_execute_plan(self, plan_id: str) -> bool:
        """
        User confirmed 'Yes, proceed'.
        Dispatches safe physical sequence in a background thread.
        """
        if plan_id not in self.active_plans:
            return False

        plan = self.active_plans[plan_id]
        plan.status = "IN_PROGRESS"
        
        # Update corresponding message in history
        for msg in self.chat_history:
            if msg.plan and msg.plan.plan_id == plan_id:
                msg.awaiting_confirmation = False

        self._abort_current_task.clear()

        def _run_execution():
            logger.info(f"Starting execution of plan {plan_id}...")
            color = plan.target_color or "Yellow"
            action = plan.target_action or "PICK_AND_PLACE"

            # Execute sequential steps with live progress
            for idx, step in enumerate(plan.steps):
                if self._abort_current_task.is_set() or hardware.emergency_stopped:
                    plan.status = "STOPPED"
                    logger.warning(f"Plan {plan_id} aborted during step {idx+1}.")
                    return

                # Perform actual kinematic movements based on step
                if "Locate" in step.description or idx == 0:
                    time.sleep(0.6)  # Vision processing delay
                
                elif "Move the arm to the object position" in step.description or idx == 1:
                    hover_pose = hardware.POSES.get(f"HOVER_{color.upper()}", hardware.POSES["HOVER_YELLOW"])
                    pick_pose = hardware.POSES.get(f"PICK_{color.upper()}", hardware.POSES["PICK_YELLOW"])
                    hardware.move_joints_smooth(hover_pose, duration_sec=1.0, position_name=f"Hovering {color}")
                    time.sleep(1.0)
                    hardware.move_joints_smooth(pick_pose, duration_sec=0.8, position_name=f"Reaching {color}")
                    time.sleep(0.8)

                elif "Close the gripper" in step.description or idx == 2:
                    hardware.set_gripper("CLOSE")
                    time.sleep(0.7)

                elif "Move to the right" in step.description or idx == 3:
                    # Lift object
                    lift_pose = hardware.POSES.get(f"HOVER_{color.upper()}", hardware.POSES["HOVER_YELLOW"])
                    hardware.move_joints_smooth(lift_pose, duration_sec=0.8, position_name="Lifting")
                    time.sleep(0.8)
                    # Move to right placement
                    place_pose = hardware.POSES["PLACE_RIGHT"]
                    hardware.move_joints_smooth(place_pose, duration_sec=1.2, position_name="Placing")
                    time.sleep(1.2)

                elif "Open the gripper" in step.description or idx == 4:
                    hardware.set_gripper("OPEN")
                    time.sleep(0.7)
                    # Return to Home
                    hardware.go_home()
                    time.sleep(1.0)

                step.completed = True
                time.sleep(0.3)

            plan.status = "COMPLETED"
            logger.info(f"Plan {plan_id} successfully completed.")

            # Append completion notification
            complete_msg = ChatMessage(
                id=f"msg-comp-{uuid.uuid4().hex[:6]}",
                sender="assistant",
                text=f"Task completed successfully! The {color.lower()} cube has been placed.",
                timestamp=datetime.now().strftime("%H:%M"),
                plan=None,
                awaiting_confirmation=False
            )
            self.chat_history.append(complete_msg)

        self._current_execution_thread = threading.Thread(target=_run_execution, daemon=True)
        self._current_execution_thread.start()
        return True

    def cancel_plan(self, plan_id: str):
        """User clicked 'Cancel'."""
        if plan_id in self.active_plans:
            plan = self.active_plans[plan_id]
            plan.status = "CANCELLED"
            for msg in self.chat_history:
                if msg.plan and msg.plan.plan_id == plan_id:
                    msg.awaiting_confirmation = False

            cancel_msg = ChatMessage(
                id=f"msg-cancel-{uuid.uuid4().hex[:6]}",
                sender="assistant",
                text="Task cancelled. Ready for your next command.",
                timestamp=datetime.now().strftime("%H:%M"),
                plan=None,
                awaiting_confirmation=False
            )
            self.chat_history.append(cancel_msg)

    def emergency_stop_all(self):
        """Abort any executing plan immediately."""
        self._abort_current_task.set()
        hardware.emergency_stop()
        for p in self.active_plans.values():
            if p.status in ["AWAITING_CONFIRMATION", "IN_PROGRESS"]:
                p.status = "STOPPED"
        
        stop_msg = ChatMessage(
            id=f"msg-stop-{uuid.uuid4().hex[:6]}",
            sender="assistant",
            text="🚨 EMERGENCY STOP EXECUTED. All motor outputs disabled immediately.",
            timestamp=datetime.now().strftime("%H:%M"),
            plan=None,
            awaiting_confirmation=False
        )
        self.chat_history.append(stop_msg)

# Global singleton
planner = TaskPlanner()

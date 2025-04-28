# analyze/goals.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from core.database import get_db_connection  # Relative import since database.py is in the parent directory
from ..ai.tree_model import TreeModel, get_additional_financial_insight  # Relative import for tree_model.py

router = APIRouter()

# Model for financial goal input
class FinancialGoalInput(BaseModel):
    user_id: int
    goal_name: str
    target_amount: float
    current_amount: float = 0.0
    deadline: Optional[str] = None  # Format: YYYY-MM-DD
    description: Optional[str] = None

# Model for updating a financial goal
class FinancialGoalUpdate(BaseModel):
    goal_name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    deadline: Optional[str] = None
    description: Optional[str] = None

# Function to determine progress level based on percentage
def get_progress_level(progress: float) -> str:
    if progress < 25:
        return "Beginner"
    elif progress < 50:
        return "Novice"
    elif progress < 75:
        return "Intermediate"
    elif progress < 100:
        return "Advanced"
    else:
        return "Completed"

# Function to format database response as a list of dictionaries
def format_db_response(cursor) -> List[dict]:
    rows = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in rows]

# Create a new financial goal
@router.post("/goals", tags=["Goals"])
async def create_goal(goal: FinancialGoalInput):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Insert the new goal into the database
        cur.execute("""
            INSERT INTO financial_goals (user_id, goal_name, target_amount, current_amount, deadline, description)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            goal.user_id,
            goal.goal_name,
            goal.target_amount,
            goal.current_amount,
            goal.deadline,
            goal.description
        ))
        
        goal_id = cur.fetchone()[0]
        conn.commit()
        
        # Fetch the newly created goal
        cur.execute("SELECT * FROM financial_goals WHERE id = %s", (goal_id,))
        new_goal = format_db_response(cur)[0]
        
        # Calculate progress and progress level
        progress = (new_goal["current_amount"] / new_goal["target_amount"]) * 100 if new_goal["target_amount"] > 0 else 0
        new_goal["progress"] = f"{progress:.2f}%"
        new_goal["progress_level"] = get_progress_level(progress)
        
        cur.close()
        conn.close()
        
        return {"message": "Financial goal created successfully", "goal": new_goal}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating goal: {str(e)}")

# Get all financial goals for a user
@router.get("/goals/{user_id}", tags=["Goals"])
async def get_goals(user_id: int):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Fetch all goals for the user
        cur.execute("SELECT * FROM financial_goals WHERE user_id = %s", (user_id,))
        goals = format_db_response(cur)
        
        cur.close()
        conn.close()
        
        if not goals:
            raise HTTPException(status_code=404, detail="No financial goals found for this user")
        
        # Add progress, progress level, and financial insights for each goal
        tree_model = TreeModel()
        for goal in goals:
            progress = (goal["current_amount"] / goal["target_amount"]) * 100 if goal["target_amount"] > 0 else 0
            goal["progress"] = f"{progress:.2f}%"
            goal["progress_level"] = get_progress_level(progress)
            # Generate a financial insight based on the goal name
            insight = get_additional_financial_insight(goal["goal_name"])
            goal["financial_insight"] = insight
        
        return {"goals": goals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving goals: {str(e)}")

# Update a financial goal
@router.put("/goals/{goal_id}", tags=["Goals"])
async def update_goal(goal_id: int, update: FinancialGoalUpdate):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if the goal exists
        cur.execute("SELECT * FROM financial_goals WHERE id = %s", (goal_id,))
        goal = format_db_response(cur)
        if not goal:
            raise HTTPException(status_code=404, detail="Financial goal not found")
        
        # Prepare the update query dynamically
        update_data = update.dict(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields provided to update")
        
        set_clause = ", ".join(f"{key} = %s" for key in update_data.keys())
        values = list(update_data.values())
        values.append(goal_id)
        
        cur.execute(f"UPDATE financial_goals SET {set_clause} WHERE id = %s", values)
        conn.commit()
        
        # Fetch the updated goal
        cur.execute("SELECT * FROM financial_goals WHERE id = %s", (goal_id,))
        updated_goal = format_db_response(cur)[0]
        
        # Calculate progress and progress level
        progress = (updated_goal["current_amount"] / updated_goal["target_amount"]) * 100 if updated_goal["target_amount"] > 0 else 0
        updated_goal["progress"] = f"{progress:.2f}%"
        updated_goal["progress_level"] = get_progress_level(progress)
        
        cur.close()
        conn.close()
        
        return {"message": "Financial goal updated successfully", "goal": updated_goal}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating goal: {str(e)}")

# Delete a financial goal
@router.delete("/goals/{goal_id}", tags=["Goals"])
async def delete_goal(goal_id: int):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if the goal exists
        cur.execute("SELECT * FROM financial_goals WHERE id = %s", (goal_id,))
        goal = format_db_response(cur)
        if not goal:
            raise HTTPException(status_code=404, detail="Financial goal not found")
        
        # Delete the goal
        cur.execute("DELETE FROM financial_goals WHERE id = %s", (goal_id,))
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {"message": f"Financial goal with ID {goal_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting goal: {str(e)}")
import torch
import torch.nn as nn
import torch.nn.functional as F
from pathlib import Path
import logging
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class FinancialModel(nn.Module):
    def __init__(self, input_size=5, hidden_size=128, output_size=3):
        super().__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.dropout = nn.Dropout(0.2)
        self.fc2 = nn.Linear(hidden_size, hidden_size // 2)
        self.fc3 = nn.Linear(hidden_size // 2, output_size)

    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return x

    @classmethod
    def load_model(cls, model_path="models/financial_model_v2.pth"):
        model = cls()
        model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
        model.eval()
        return model

    def save_model(self, model_path="models/financial_model_v2.pth"):
        Path(model_path).parent.mkdir(parents=True, exist_ok=True)
        torch.save(self.state_dict(), model_path)

def train_model(X, y, model_path="models/financial_model_v2.pth"):
    model = FinancialModel(input_size=X.shape[1], hidden_size=128, output_size=3)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    for epoch in range(100):
        model.train()
        outputs = model(torch.tensor(X, dtype=torch.float32))
        loss = criterion(outputs, torch.tensor(y, dtype=torch.long))
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    model.save_model(model_path)
    return model

class ChatMessage(BaseModel):
    role: str
    content: str

# User related models
class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True

# Invitation related models
class InvitationBase(BaseModel):
    invitation_code: str

class InvitationCreate(InvitationBase):
    email: Optional[EmailStr] = None

class Invitation(InvitationBase):
    id: int
    is_used: bool
    created_at: datetime
    used_at: Optional[datetime] = None
    created_by: int
    email: Optional[EmailStr] = None

class InvitationInDB(InvitationBase):
    id: int
    is_used: bool
    created_at: datetime
    used_at: Optional[datetime] = None
    created_by: int
    email: Optional[EmailStr] = None

    class Config:
        orm_mode = True

class InvitationResponse(BaseModel):
    invitations: List[InvitationInDB]
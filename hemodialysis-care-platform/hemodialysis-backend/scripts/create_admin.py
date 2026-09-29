"""
ایجاد کاربر ادمین از طریق CLI
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.shared.enums import UserRole
from create_user import create_user


if __name__ == "__main__":
    create_user(UserRole.ADMIN)

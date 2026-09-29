import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import Type

from sqlalchemy import DateTime, Enum as SAEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


def pg_enum(enum_cls: Type[PyEnum], name: str, **kwargs) -> SAEnum:
    """Persist Python enum *values* (e.g. male) instead of member names (MALE)."""
    return SAEnum(
        enum_cls,
        name=name,
        values_callable=lambda members: [item.value for item in members],
        **kwargs,
    )


class BaseModel(Base):
    """
    مدل پایه برای تمام جداول

    تمام جداول سیستم از این کلاس ارث می‌برند و
    فیلدهای id، created_at و updated_at را خودکار دارند.
    """
    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def to_dict(self) -> dict:
        """تبدیل مدل به dictionary برای serialization"""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, uuid.UUID):
                value = str(value)
            elif isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result
"""
Exception های business logic سیستم
"""


class HemodialysisBaseException(Exception):
    """Base exception سیستم"""
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(message)


class PatientNotFoundException(HemodialysisBaseException):
    pass


class UserNotFoundException(HemodialysisBaseException):
    pass


class DuplicatePhoneNumberException(HemodialysisBaseException):
    pass


class DuplicateMedicalRecordException(HemodialysisBaseException):
    pass


class InvalidCredentialsException(HemodialysisBaseException):
    pass


class InactiveUserException(HemodialysisBaseException):
    pass


class TokenBlacklistedException(HemodialysisBaseException):
    pass


class InsufficientPermissionsException(HemodialysisBaseException):
    pass


class InvalidLabValueException(HemodialysisBaseException):
    pass


class InvalidBPException(HemodialysisBaseException):
    pass


class InvalidWeightException(HemodialysisBaseException):
    pass


class DuplicateLabPanelException(HemodialysisBaseException):
    pass


class DuplicateSessionException(HemodialysisBaseException):
    pass


class SessionAlreadyExistsException(HemodialysisBaseException):
    pass


#class RecommendationAlreadyReviewedException(HemodialysisBaseException):
#    pass


class OwnResourceAccessException(HemodialysisBaseException):
    pass


class InvalidPasswordException(HemodialysisBaseException):
    pass


class WeakPasswordException(HemodialysisBaseException):
    pass


"""
Exception های اضافه‌شده برای TASK-024/026
"""

class AlertNotFoundException(Exception):
    def __init__(self, message: str = "هشدار یافت نشد"):
        self.message = message
        super().__init__(message)


class RecommendationNotFoundException(Exception):
    def __init__(self, message: str = "توصیه یافت نشد"):
        self.message = message
        super().__init__(message)


class RecommendationAlreadyReviewedException(Exception):
    def __init__(self, message: str = "این توصیه قبلاً بررسی شده است"):
        self.message = message
        super().__init__(message)


class InvalidStateTransitionException(Exception):
    def __init__(self, message: str = "تغییر وضعیت مجاز نیست"):
        self.message = message
        super().__init__(message)


class MessageNotFoundException(Exception):
    def __init__(self, message: str = "پیام یافت نشد"):
        self.message = message
        super().__init__(message)


class UnauthorizedAccessException(Exception):
    def __init__(self, message: str = "دسترسی مجاز نیست"):
        self.message = message
        super().__init__(message)
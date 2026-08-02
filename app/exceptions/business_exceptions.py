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


class RecommendationAlreadyReviewedException(HemodialysisBaseException):
    pass


class OwnResourceAccessException(HemodialysisBaseException):
    pass


class InvalidPasswordException(HemodialysisBaseException):
    pass


class WeakPasswordException(HemodialysisBaseException):
    pass
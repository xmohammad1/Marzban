import time
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session


def commit_with_retry(db: Session, retries: int = 3, backoff: float = 0.5) -> None:
    """Commit the session with retries on lock timeout errors.

    Args:
        db (Session): Database session.
        retries (int): Number of retries before giving up.
        backoff (float): Initial backoff time in seconds.
    """
    for attempt in range(retries):
        try:
            db.commit()
            return
        except OperationalError as exc:
            if getattr(exc.orig, "args", [None])[0] == 1205:  # Lock wait timeout
                db.rollback()
                if attempt < retries - 1:
                    time.sleep(backoff * (2 ** attempt))
                    continue
            raise

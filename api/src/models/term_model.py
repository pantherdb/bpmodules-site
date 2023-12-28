import strawberry
from pydantic import  typing

@strawberry.type
class Term:
    id: str
    label: typing.Optional[str] = ""
    display_id: typing.Optional[str] = ""
    count: typing.Optional[int] = 0
    

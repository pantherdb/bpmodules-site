from enum import Enum
import strawberry
import typing
from src.models.gene_model import Gene
from src.models.term_model import Term


@strawberry.enum
class AutocompleteType(Enum):
    slim_term = 'slim_term'
    gene = 'gene'

@strawberry.type
class Entity :
    id: str
    label: str
    aspect: str
    display_id:str

   
@strawberry.type
class ResultCount:
    total: int

@strawberry.type
class DispositionSource:
    term_id: str
    disposition: str

@strawberry.type
class Annotation:
    id: str
    section_id: typing.Optional[str] = ''
    section_label: typing.Optional[str] = ''
    category_id: typing.Optional[str] = ''
    category_label: typing.Optional[str] = ''
    module_label: typing.Optional[str] = ''
    module_id: typing.Optional[str] = ''
    disposition_sources: typing.List[DispositionSource]
    disposition: typing.Optional[str]
    disposition_target_id: typing.Optional[str]
    node_id: typing.Optional[str] = ''
    node_label: typing.Optional[str] = ''
    terms: typing.List[Term] 
    leaf_genes: typing.List[Gene] 
    category_count: int
    module_count: int
    node_count: int
    
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if key == 'terms' :
                setattr(self, key, [Term(**value_k) for value_k in value if value_k != None])
            elif key == 'disposition_sources':
                setattr(self, key, [DispositionSource(**value_k) for value_k in value  if value_k != None])
            elif key == 'leaf_genes':
                setattr(self, key, [Gene(**value_k) for value_k in value  if value_k != None])
            else:
                setattr(self, key,  value)
 

@strawberry.type
class Bucket:
    key: str
    doc_count: int
    meta: typing.Optional[Entity] = None


@strawberry.type
class Frequency:
    buckets: typing.List[Bucket]
    
@strawberry.type
class AnnotationStats:
    term_type_frequency: Frequency 
    aspect_frequency: Frequency 
    evidence_type_frequency: Frequency
    slim_term_frequency: Frequency
    

@strawberry.input
class AnnotationFilterArgs:
    section_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
    category_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
    module_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
    gene_ids: typing.Optional[typing.List[str]] = strawberry.UNSET,

@strawberry.input
class PageArgs:
    page: typing.Optional[int] = 0
    size: typing.Optional[int] = 50
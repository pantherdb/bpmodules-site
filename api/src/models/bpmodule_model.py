from enum import Enum
import strawberry
import typing
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
class Gene:
    gene: str
    gene_symbol: typing.Optional[str]
    gene_name: typing.Optional[str]
    long_id: typing.Optional[str] =  None
    panther_family: typing.Optional[str] =  None
    taxon_abbr: typing.Optional[str]
    taxon_label: typing.Optional[str]
    taxon_id: typing.Optional[str]
    coordinates_chr_num:typing.Optional[str] =  None
    coordinates_start:typing.Optional[int] =  None
    coordinates_end:typing.Optional[int] =  None
    coordinates_strand: typing.Optional[int] =  None
    terms: typing.List[Term]
    slim_terms: typing.List[Term]
    term_count: typing.Optional[int]
    
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if key == 'slim_terms' or key == 'terms':
                setattr(self, key, [self.add_term_display_id(value_k) for value_k in value])
            else:
                setattr(self, key,  value)
                
                
    def add_term_display_id(self, value):
        term = Term(**value)
        term.display_id = term.id if term.id.startswith("GO") else ''
        return term
    
@strawberry.type
class ResultCount:
    total: int

@strawberry.type
class DispositionSource:
    term_id: str
    disposition: str

@strawberry.type
class BPModule:
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
 

@strawberry.type
class Bucket:
    key: str
    doc_count: int
    meta: typing.Optional[Entity] = None


@strawberry.type
class Frequency:
    buckets: typing.List[Bucket]
    
@strawberry.type
class BPModuleStats:
    term_type_frequency: Frequency 
    aspect_frequency: Frequency 
    evidence_type_frequency: Frequency
    slim_term_frequency: Frequency
    

@strawberry.input
class BPModuleFilterArgs:
    section_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
    category_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
    gene_ids: typing.Optional[typing.List[str]] = strawberry.UNSET,

@strawberry.input
class PageArgs:
    page: typing.Optional[int] = 0
    size: typing.Optional[int] = 50
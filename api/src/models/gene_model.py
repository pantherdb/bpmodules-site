from enum import Enum
import strawberry
import typing


@strawberry.type
class Gene:
    id: typing.Optional[str] = ''
    gene: typing.Optional[str]
    gene_symbol: typing.Optional[str]
    gene_name: typing.Optional[str]
    long_id: typing.Optional[str] =  None
    panther_family: typing.Optional[str] =  None
    taxon_abbr: typing.Optional[str] =  None
    taxon_label: typing.Optional[str] =  None
    taxon_id: typing.Optional[str] =  None
    coordinates_chr_num:typing.Optional[str] =  None
    coordinates_start:typing.Optional[int] =  None
    coordinates_end:typing.Optional[int] =  None
    coordinates_strand: typing.Optional[int] =  None
    
                
@strawberry.input
class GeneFilterArgs:
    gene_ids: typing.Optional[typing.List[str]] = strawberry.UNSET
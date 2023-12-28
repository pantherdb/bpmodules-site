import strawberry
from pydantic import typing
from strawberry.types import Info
from src.models.term_model import Term
from src.resolvers.bpmodule_stats_resolver import get_bpmodules_count, get_bpmodules_stats, get_genes_count
from src.resolvers.autocomplete_resolver import get_autocomplete, get_slim_term_autocomplete_query_multi
from src.resolvers.bpmodule_resolver import get_bpmodule, get_bpmodules, get_bpmodules_export, get_genes
from src.models.bpmodule_model import BPModule, BPModuleExport, BPModuleFilterArgs, BPModuleGroup, BPModuleStats, AutocompleteType, Gene, GeneFilterArgs, PageArgs, ResultCount
from src.utils import get_selected_fields

@strawberry.type
class BPModuleQuery:

    @strawberry.field
    async def bpmodule(self, info:Info, id:str) -> BPModule:
        return await get_bpmodule(id)

    @strawberry.field
    async def bpmodules(self, info:Info, filter_args:typing.Optional[BPModuleFilterArgs]=None, 
      page_args:typing.Optional[PageArgs] = None) -> typing.List[BPModule]:
        return await get_bpmodules(filter_args, page_args)
    
    @strawberry.field
    async def genes(self, info:Info, filter_args:typing.Optional[GeneFilterArgs]=None, 
      page_args:typing.Optional[PageArgs] = None) -> typing.List[Gene]:
        return await get_genes(filter_args, page_args)
    
    @strawberry.field
    async def bpmodules_export(self, info:Info, filter_args:typing.Optional[BPModuleFilterArgs]=None, 
      page_args:typing.Optional[PageArgs] = None) -> BPModuleExport:
        return await get_bpmodules_export(filter_args, page_args)

    @strawberry.field
    async def bpmodules_count(self, info:Info, filter_args:typing.Optional[BPModuleFilterArgs]=None) -> ResultCount:
        return await get_bpmodules_count(filter_args)   
    
    @strawberry.field
    async def genes_count(self, info:Info, filter_args:typing.Optional[GeneFilterArgs]=None) -> ResultCount:
        return await get_genes_count(filter_args)       

    @strawberry.field
    async def stats(self, info:Info, filter_args:typing.Optional[BPModuleFilterArgs]=None) -> BPModuleStats:
        return await get_bpmodules_stats(filter_args)       

    @strawberry.field
    async def autocomplete(self, info:Info, autocomplete_type: AutocompleteType,  keyword:str, filter_args:typing.Optional[GeneFilterArgs]=None,) -> typing.List[Gene]:
        return await get_autocomplete(autocomplete_type, keyword, filter_args)

    @strawberry.field
    async def slim_terms_autocomplete(self, info:Info,  keyword:str, filter_args:typing.Optional[BPModuleFilterArgs]=None) -> typing.List[Term]:
        return await get_slim_term_autocomplete_query_multi(keyword, filter_args)
 
 
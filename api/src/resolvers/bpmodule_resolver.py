# import load_env
# import asyncio
import json
import pprint
import typing
from src.models.bpmodule_model import BPModule, BPModuleFilterArgs, Gene, PageArgs, ResultCount
from src.config.settings import settings
from src.config.es import  es

async def get_bpmodule(id:str):

    resp = await es.get(
          index=settings.PANGO_BPMODULES_INDEX,
          id=id
    )

    results = BPModule(id=resp['_id'], **resp['_source'])
        
    return results    


async def get_bpmodules(filter_args:BPModuleFilterArgs, page_args=PageArgs):

    if page_args is None:
      page_args = PageArgs

    query = await get_bpmodules_query(filter_args)
    resp = await es.search(
          index=settings.PANGO_BPMODULES_INDEX,
          filter_path ='took,hits.hits._score,**hits.hits._id**, **hits.hits._source**',
          query=query,
          from_=page_args.page*page_args.size,
          size=page_args.size,
    )

    results = [BPModule(id=hit['_id'], **hit['_source']) for hit in resp.get('hits', {}).get('hits', [])]
        
    return results    


async def get_bpmodules_query(filter_args:BPModuleFilterArgs):
  
    filters = list()

    if filter_args != None:
      if filter_args.section_ids != None and len(filter_args.section_ids)>0:
            filters.append(  
              {           
                "terms": {
                  "section_id.keyword": filter_args.section_ids
                }
              })   
            
    if filter_args != None:
      if filter_args.category_ids != None and len(filter_args.category_ids)>0:
            filters.append(  
              {           
                "terms": {
                  "category_id.keyword": filter_args.category_ids
                }
              })  
            
    if filter_args != None:
      if filter_args.module_ids != None and len(filter_args.module_ids)>0:
            filters.append(  
              {           
                "terms": {
                  "module_id.keyword": filter_args.module_ids
                }
              })  
            
   

      if filter_args.slim_term_ids != None and len(filter_args.slim_term_ids)>0:
            filters.append( 
              {
               "nested": {
                  "path":"slim_terms",
                  "query": {
                    "terms": {
                      "slim_terms.id.keyword": filter_args.slim_term_ids
                    }
                  }
                }
            })
         
  
   
    query = {  
      "bool": {  
        "filter": filters
      }
    }
    
    return query 
  

async def main():
    #results = await get_bpmodules()
   # pprint.pp(results)
   pass

if __name__ == "__main__":

    #loop = asyncio.get_event_loop()
    #loop.run_until_complete(main())
    #loop.close()
    pass
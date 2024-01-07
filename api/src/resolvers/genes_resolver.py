# import load_env
# import asyncio
import json
import pprint
import typing
from src.models.annotation_model import PageArgs
from src.models.gene_model import Gene, GeneFilterArgs, Gene
from src.config.settings import settings
from src.config.es import  es 

async def get_gene(id:str):

    resp = await es.get(
          index=settings.PANGO_GENES_INDEX,
          id=id
    )

    results = Gene(id=resp['_id'], **resp['_source'])
        
    return results    


async def get_genes(filter_args:GeneFilterArgs, page_args=PageArgs):

    if page_args is None:
      page_args = PageArgs

    query = await get_genes_query(filter_args)
    resp = await es.search(
          index=settings.PANGO_GENES_INDEX,
          filter_path ='took,hits.hits._score,**hits.hits._id**, **hits.hits._source**',
          query=query,
          from_=page_args.page*page_args.size,
          size=page_args.size,
    )

    results = [Gene(id=hit['_id'], **hit['_source']) for hit in resp.get('hits', {}).get('hits', [])]
   
    return results    


async def get_genes_query(filter_args:GeneFilterArgs):
  
    filters = []

    if filter_args != None:
      if filter_args.gene_ids != None and len(filter_args.gene_ids)>0:
        gene_terms_filter = {
            "bool": {
                "should": [
                    {"terms": {"gene.keyword": filter_args.gene_ids}},
                    {"terms": {"gene_symbol.keyword": filter_args.gene_ids}}
                ],
                "minimum_should_match": 1
            }
        }
        filters.append(gene_terms_filter)

    query = {
        "bool": {
            "must": filters 
        }
    }

    return query
  

async def main():
    #results = await get_genes()
   # pprint.pp(results)
   pass

if __name__ == "__main__":

    #loop = asyncio.get_event_loop()
    #loop.run_until_complete(main())
    #loop.close()
    pass
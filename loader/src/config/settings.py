import os
from pydantic import BaseSettings

class Settings(BaseSettings):

    PANGO_ES_URL:str = os.environ.get("PANGO_ES_URL")
    PANGO_BPMODULES_INDEX :str = os.environ.get("PANGO_BPMODULES_INDEX")
    PANGO_GENES_INDEX :str = os.environ.get("PANGO_GENES_INDEX")
    PROJECT_TITLE: str = "PANGO loader"
    PROJECT_VERSION: str = "0.0.2"



settings = Settings()
# Use base jupyter image that comes with jupyterlab
FROM jupyter/base-notebook

USER root

# Upgrade JupyterLab
RUN mamba install -c conda-forge -y git jupyterlab nbdime 

# ADD --chown=1000:1000 examples /home/jovyan/work/
ADD --chown=1000:1000 merge-repo.tar.xz /home/jovyan/work

USER 1000

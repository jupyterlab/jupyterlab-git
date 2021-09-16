# Use base jupyter image that comes with jupyterlab
FROM jupyter/base-notebook

USER root

# Upgrade JupyterLab
RUN mamba install -c conda-forge -y git jupyterlab nbdime 

# Copy and unarchive merge conflict example repo
# Cannot use symlinks, need another examples folder just for ui-tests
ADD --chown=1000:1000 data/merge-conflict-example.tar.gz /home/jovyan/work

USER 1000

FROM meteorhacks/meteord:onbuild
RUN apt-get install git-core -y
ENTRYPOINT bash ./app/run_app.sh
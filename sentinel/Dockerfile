FROM redis:6-alpine

COPY sentinel.conf /redis/sentinel.conf

EXPOSE 26379

ENTRYPOINT ["redis-server"]
CMD ["/redis/sentinel.conf", "--sentinel"]
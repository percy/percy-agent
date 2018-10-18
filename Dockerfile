FROM node:10.0.0
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install -g @percy/agent
CMD ["/bin/sh"]

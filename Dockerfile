FROM node:16
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install -g @percy/agent
CMD ["/bin/sh"]

FROM node:13

RUN apt-get update
RUN apt-get install -y fontconfig

#tahoma
RUN apt-get install -y cabextract xfonts-utils fonts-baekmuk fonts-takao fonts-horai-umefont fonts-thai-tlwg && \
	wget http://ftp.de.debian.org/debian/pool/contrib/m/msttcorefonts/ttf-mscorefonts-installer_3.6_all.deb && \
	dpkg -i ttf-mscorefonts-installer_3.6_all.deb && \
	fc-cache -fv

RUN apt-get install -y xvfb x11-xkb-utils xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic x11-apps clang libdbus-1-dev libgtk2.0-dev libnotify-dev libgnome-keyring-dev libgconf2-dev libasound2-dev libcap-dev libcups2-dev libxtst-dev libxss1 libnss3-dev gcc-multilib g++-multilib

# additional fonts
RUN apt-get -qqy update \
  && apt-get -qqy --no-install-recommends install \
fonts-beng fonts-beng-extra fonts-dejavu fonts-dejavu-core fonts-dejavu-extra fonts-deva fonts-deva-extra fonts-droid-fallback fonts-freefont-ttf fonts-gargi fonts-gubbi fonts-gujr fonts-gujr-extra fonts-guru fonts-guru-extra fonts-indic fonts-kacst fonts-kacst-one fonts-kalapi fonts-knda fonts-lao fonts-lato fonts-liberation fonts-liberation2 fonts-lklug-sinhala fonts-lohit-beng-assamese fonts-lohit-beng-bengali fonts-lohit-deva fonts-lohit-gujr fonts-lohit-guru fonts-lohit-knda fonts-lohit-mlym fonts-lohit-orya fonts-lohit-taml fonts-lohit-taml-classical fonts-lohit-telu fonts-lyx fonts-mathjax fonts-mlym fonts-nakula fonts-navilu fonts-noto-cjk fonts-noto-hinted fonts-noto-mono fonts-opensymbol fonts-orya fonts-orya-extra fonts-pagul fonts-sahadeva fonts-samyak-deva fonts-samyak-gujr fonts-samyak-mlym fonts-samyak-taml fonts-sarai fonts-sil-abyssinica fonts-sil-gentium fonts-sil-gentium-basic fonts-sil-padauk fonts-smc fonts-symbola fonts-taml fonts-telu fonts-telu-extra fonts-thai-tlwg fonts-tibetan-machine fonts-tlwg-garuda fonts-tlwg-garuda-ttf fonts-tlwg-kinnari fonts-tlwg-kinnari-ttf fonts-tlwg-laksaman fonts-tlwg-laksaman-ttf fonts-tlwg-loma fonts-tlwg-loma-ttf fonts-tlwg-mono fonts-tlwg-mono-ttf fonts-tlwg-norasi fonts-tlwg-norasi-ttf fonts-tlwg-purisa fonts-tlwg-purisa-ttf fonts-tlwg-sawasdee fonts-tlwg-sawasdee-ttf fonts-tlwg-typewriter fonts-tlwg-typewriter-ttf fonts-tlwg-typist fonts-tlwg-typist-ttf fonts-tlwg-typo fonts-tlwg-typo-ttf fonts-tlwg-umpush fonts-tlwg-umpush-ttf fonts-tlwg-waree fonts-tlwg-waree-ttf \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get -qyy clean

# tini
ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini


#npm
RUN mkdir -p /sites/export-service/tempFolder && mkdir -p /sites/export.dhtmlx.com && mkdir -p /data/exports && mkdir -p /data/configs
COPY ./package.json /sites/export-service
# RUN cd /sites/export-service/ && npm set registry http://192.168.0.103:4873 && npm install
RUN cd /sites/export-service/ && npm install

#files
COPY . /sites/export-service

# We need it to remove the following error message:
# line 100: unknown element "blank"
RUN mv /sites/export-service/common/fonts.conf /etc/fonts/fonts.conf

ENV PUBLIC_PORT=80
WORKDIR /sites/export-service
ENTRYPOINT ["/tini", "--", "npm", "run", "start:docker"]

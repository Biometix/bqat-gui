flags="$*"
bqat_gui_web=$(pwd)/web
bqat_gui_desktop=$(pwd)/desktop

if [ "$flags" = "--fresh" ]; then
    echo 'Checking bqat-gui web version'
    cd "$bqat_gui_web" && \
    npm install && \
    npm run type-check && \
    echo 'Success'
    echo '============='
    echo ''

    echo 'Checking bqat-gui desktop version'
    cd "$bqat_gui_desktop" && \
    npm install && \
    npm run type-check && \
    echo 'Success'
    echo '============='
    echo ''
else
    cd "$bqat_gui_web" && \
    echo 'get into the bqat-gui web folder'

    npm run type-check && \
    echo 'finish type-check'

    cd "$bqat_gui_desktop" && \
    rm -r "$bqat_gui_desktop/src/" && \
    cp -R "$bqat_gui_web/src" "$bqat_gui_desktop/src" && \
    echo 'copy src to desktop'

    npm run type-check && \
    echo 'finish type-check'
fi
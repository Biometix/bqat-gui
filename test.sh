flags="$*"
bqat_gui_dir=$(pwd)/bqat_gui
desktop_dir=$(pwd)/desktop

if [ "$flags" = "--fresh" ]; then
    echo 'Checking bqat_gui version'
    cd "$bqat_gui_dir" && \
    npm install && \
    npm run type-check && \
    echo 'Success'

    echo 'Checking desktop version'
    cd "$desktop_dir" && \
    npm install && \
    npm run type-check && \
    echo 'Success'
else
    cd "$bqat_gui_dir" && \
    echo 'get into the bqat_gui folder'

    npm run type-check && \
    echo 'finish type-check'

    cd "$desktop_dir" && \
    rm -r "$desktop_dir/src/" && \
    cp -R "$bqat_gui_dir/src" "$desktop_dir/src" && \
    echo 'copy src to desktop'

    npm run type-check && \
    echo 'finish type-check'
fi
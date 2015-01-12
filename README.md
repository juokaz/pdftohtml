# Convert pdf document to a list of html pages of text with an image background

xvfb-run --auto-servernum slimerjs render.js slides.pdf slides.json

## Slimer.js setup

    Something like this using Puppet

    # slimerjs setup
    $slimerjsRequirements = ["libc6", "libstdc++6", "libgcc1", "firefox", "xvfb"]
    package { $slimerjsRequirements: ensure => "installed" }

    # download slimerjs
    exec { "download-slimerjs":
      command => "wget http://download.slimerjs.org/v0.9/0.9.1/slimerjs-0.9.1-linux-x86_64.tar.bz2 && test -d '/home/vagrant/tools' || mkdir -p /home/vagrant/tools && mv -f slimerjs-0.9.1-linux-x86_64.tar.bz2 /home/vagrant/tools/slimerjs.tar.bz2 && tar -xf /home/vagrant/tools/slimerjs.tar.bz2 -C /home/vagrant/tools && ln -s /home/vagrant/tools/slimerjs-0.9.1/slimerjs /usr/bin/slimerjs",
      creates => "/usr/bin/slimerjs",
      require => Package[$slimerjsRequirements]
    }

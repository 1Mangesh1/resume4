FROM ubuntu:22.04

# Prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install TeX Live and dependencies
RUN apt-get update && apt-get install -y \
    texlive-full \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-lang-all \
    ghostscript \
    imagemagick \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Create a non-root user for security
RUN useradd -m -u 1000 texuser && \
    chown -R texuser:texuser /workspace

USER texuser

# Default command
CMD ["pdflatex", "--help"]

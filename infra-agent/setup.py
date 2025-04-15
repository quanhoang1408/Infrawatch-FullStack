from setuptools import setup, find_packages

setup(
    name="infra-agent",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "requests>=2.28.0,<3.0.0",
        "psutil>=5.9.0,<6.0.0",
        "apscheduler>=3.9.0,<4.0.0",
        "python-dotenv>=1.0.0,<2.0.0",
    ],
    entry_points={
        "console_scripts": [
            "infra-agent=main:main",
        ],
    },
    python_requires=">=3.7",
    author="Your Name",
    author_email="your.email@example.com",
    description="Agent for Infrawatch monitoring system",
)
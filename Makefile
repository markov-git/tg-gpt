build:
	docker build -t "tg-gpt" .

run:
	docker run -d -p 3000:3000 --name "tg-gpt" --rm "tg-gpt"
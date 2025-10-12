import pandas as pd
df = pd.read_csv('D:\Aadil\PtV_World\data\tourist_places.csv')
df.to_json('D:\Aadil\PtV_World\data\tourist_places.json', orient="records", indent=2)

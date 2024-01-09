#!/bin/sh

cwd=$PWD

read -p "prefix: " prefix
read -p "category: " category

emojis=$(ls | grep -E '\.(png|gif)$')

tmp=$(mktemp -d)

echo name,file,category,aliases > $tmp/meta.csv

for file in $emojis
do
  destFile=${prefix}$(echo $file | sed -e 's/-/_/g')
  cp $file $tmp/$destFile
  name=${prefix}$(echo $file | sed -E 's/-/_/g; s/\.(png|gif)$//')
  echo ${name},${destFile},$category >> $tmp/meta.csv
done

cd $tmp

emopack pack $cwd/out.zip

cd $cwd

rm -rf $tmp